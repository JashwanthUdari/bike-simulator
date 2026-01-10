class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    const isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    this.bgKey = isMobile ? "bgMobile" : "bgLaptop";

    this.load.image("bgLaptop", "assets/backgroundlaptop.png");
    this.load.image("bgMobile", "assets/backgroundmobile.png");
    this.load.image("bike", "assets/bike.png");
    this.load.image("car", "assets/car.png");
    this.load.image("car", "assets/car1.png");
  }

  create() {
    const { width, height } = this.scale;

    /* ===== GAME STATE ===== */
    this.baseSpeed = 4;
    this.speed = this.baseSpeed;
    this.score = 0;
    this.isGameOver = false;

    /* ===== BACKGROUND ===== */
    this.bg1 = this.add.image(width / 2, height / 2, this.bgKey)
      .setDisplaySize(width, height);

    this.bg2 = this.add.image(width / 2, -height / 2, this.bgKey)
      .setDisplaySize(width, height);

    /* ===== LANES ===== */
    this.lanes = [
      width * 0.35,
      width * 0.5,
      width * 0.65
    ];
    this.currentLane = 1;

    /* ===== LANE MARKERS ===== */
    this.laneMarkers = this.lanes.map(x =>
      this.add.rectangle(x, height / 2, 6, height, 0xffffff, 0.08)
    );
    this.highlightLane();

    /* ===== BIKE ===== */
    this.bike = this.physics.add.sprite(
      this.lanes[this.currentLane],
      height * 0.78,
      "bike"
    );
    this.bike.setScale(0.32);
    this.bike.setDepth(10);
    this.bike.setCollideWorldBounds(true);

    /* ===== SCORE UI ===== */
    this.scoreText = this.add.text(
      width - 20,
      20,
      "Score: 0",
      {
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000",
        strokeThickness: 4
      }
    ).setOrigin(1, 0);

    /* ===== INPUT ===== */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.canMove = true;
    this.createButtons();

    /* ===== CARS ===== */
    this.cars = this.physics.add.group();
    this.physics.add.overlap(this.bike, this.cars, this.handleCrash, null, this);

    this.time.addEvent({
      delay: 1400,
      callback: this.spawnCar,
      callbackScope: this,
      loop: true
    });

    /* ===== SCORE TIMER ===== */
    this.time.addEvent({
      delay: 200,
      callback: () => {
        if (!this.isGameOver) {
          this.score += 1;
          this.scoreText.setText("Score: " + this.score);

          if (this.score % 50 === 0) {
            this.speed += 0.4;
          }
        }
      },
      loop: true
    });
  }

  createButtons() {
    const { width, height } = this.scale;

    const leftBtn = this.add.rectangle(100, height - 90, 160, 100, 0x000000, 0.6)
      .setInteractive();
    this.add.text(leftBtn.x, leftBtn.y, "LEFT", { fontSize: "24px", color: "#fff" }).setOrigin(0.5);
    leftBtn.on("pointerdown", () => this.moveLane(-1));

    const rightBtn = this.add.rectangle(width - 100, height - 90, 160, 100, 0x000000, 0.6)
      .setInteractive();
    this.add.text(rightBtn.x, rightBtn.y, "RIGHT", { fontSize: "24px", color: "#fff" }).setOrigin(0.5);
    rightBtn.on("pointerdown", () => this.moveLane(1));
  }

  moveLane(direction) {
    if (!this.canMove) return;

    const newLane = this.currentLane + direction;
    if (newLane < 0 || newLane > 2) return;

    this.currentLane = newLane;
    this.canMove = false;
    this.highlightLane();

    this.tweens.add({
      targets: this.bike,
      x: this.lanes[this.currentLane],
      duration: 180,
      ease: "Power2",
      onComplete: () => this.canMove = true
    });

    this.bike.setRotation(direction * 0.15);
  }

  highlightLane() {
    this.laneMarkers.forEach((m, i) =>
      m.setFillStyle(0xffffff, i === this.currentLane ? 0.18 : 0.06)
    );
  }

  spawnCar() {
    if (this.isGameOver) return;

    const lane = Phaser.Math.Between(0, 2);
    const car = this.cars.create(this.lanes[lane], -80, "car");
    car.setScale(0.45);
    car.setVelocityY(200 + this.speed * 40);
  }

  update() {
    if (this.isGameOver) return;

    /* ===== BACKGROUND SCROLL ===== */
    this.bg1.y += this.speed;
    this.bg2.y += this.speed;

    if (this.bg1.y >= this.scale.height * 1.5) {
      this.bg1.y = this.bg2.y - this.scale.height;
    }
    if (this.bg2.y >= this.scale.height * 1.5) {
      this.bg2.y = this.bg1.y - this.scale.height;
    }

    /* ===== KEYBOARD ===== */
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.moveLane(-1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.moveLane(1);

    this.bike.rotation *= 0.9;

    this.cars.children.iterate(car => {
      if (car && car.y > this.scale.height + 100) car.destroy();
    });
  }

  handleCrash() {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.physics.pause();

    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      color: "#ff0000"
    }).setOrigin(0.5);

    const btn = this.add.rectangle(width / 2, height / 2 + 40, 220, 70, 0x00aa00)
      .setInteractive();

    this.add.text(btn.x, btn.y, "RESTART", { fontSize: "26px", color: "#fff" }).setOrigin(0.5);
    btn.on("pointerdown", () => this.scene.restart());
  }
}

/* ===== CONFIG ===== */
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: { default: "arcade" },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: BikeScene
};

const game = new Phaser.Game(config);
window.addEventListener("resize", () => game.scale.resize(window.innerWidth, window.innerHeight));
