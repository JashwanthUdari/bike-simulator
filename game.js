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
    this.load.image("car", "assets/car1.png");
    this.load.image("car", "assets/car.png");
    this.load.audio("music", "assets/bg-music.mp3");
  }

  create() {
    const { width, height } = this.scale;

    this.speed = 5;
    this.isGameOver = false;

    /* ===== BACKGROUND ===== */
    this.bg1 = this.add.image(width / 2, height / 2, this.bgKey)
      .setDisplaySize(width, height);
    this.bg2 = this.add.image(width / 2, -height / 2, this.bgKey)
      .setDisplaySize(width, height);

    /* ===== LANES (ONLY FOR CARS) ===== */
    this.lanes = [
      width * 0.35,
      width * 0.5,
      width * 0.65
    ];

    /* ===== BIKE (FREE MOVEMENT) ===== */
    this.bike = this.physics.add.sprite(width / 2, height * 0.78, "bike");
    this.bike.setScale(0.32);
    this.bike.setDepth(5);
    this.bike.setCollideWorldBounds(true);

    /* ===== INPUT ===== */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.moveLeft = false;
    this.moveRight = false;
    this.createButtons();

    /* ===== CARS ===== */
    this.cars = this.physics.add.group();
    this.physics.add.overlap(this.bike, this.cars, this.handleCrash, null, this);

    this.time.addEvent({
      delay: 1300,
      callback: this.spawnCar,
      callbackScope: this,
      loop: true
    });

    /* ===== MUSIC ===== */
    this.music = this.sound.add("music", { loop: true, volume: 0.5 });

    this.input.once("pointerdown", () => {
      if (!this.music.isPlaying) {
        this.music.play();
      }
    });
  }

  createButtons() {
    const { width, height } = this.scale;

    const leftBtn = this.add.rectangle(100, height - 90, 160, 100, 0x000000, 0.6)
      .setInteractive();
    this.add.text(leftBtn.x, leftBtn.y, "LEFT", { fontSize: "24px", color: "#fff" }).setOrigin(0.5);
    leftBtn.on("pointerdown", () => this.moveLeft = true);
    leftBtn.on("pointerup", () => this.moveLeft = false);
    leftBtn.on("pointerout", () => this.moveLeft = false);

    const rightBtn = this.add.rectangle(width - 100, height - 90, 160, 100, 0x000000, 0.6)
      .setInteractive();
    this.add.text(rightBtn.x, rightBtn.y, "RIGHT", { fontSize: "24px", color: "#fff" }).setOrigin(0.5);
    rightBtn.on("pointerdown", () => this.moveRight = true);
    rightBtn.on("pointerup", () => this.moveRight = false);
    rightBtn.on("pointerout", () => this.moveRight = false);
  }

  spawnCar() {
    if (this.isGameOver) return;

    const lane = Phaser.Math.Between(0, 2);
    const car = this.cars.create(this.lanes[lane], -80, "car");
    car.setScale(0.42);
    car.setVelocityY(350);
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

    /* ===== BIKE FREE MOVEMENT ===== */
    this.bike.setVelocityX(0);

    if (this.moveLeft || this.cursors.left.isDown) {
      this.bike.setVelocityX(-300);
      this.bike.setRotation(-0.12);
    }

    if (this.moveRight || this.cursors.right.isDown) {
      this.bike.setVelocityX(300);
      this.bike.setRotation(0.12);
    }

    this.bike.rotation *= 0.9;

    /* ===== CLEANUP ===== */
    this.cars.children.iterate(car => {
      if (car && car.y > this.scale.height + 100) {
        car.destroy();
      }
    });
  }

  handleCrash() {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.physics.pause();

    /* ===== STOP MUSIC ===== */
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }

    /* ===== VIBRATION ===== */
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      color: "#ff0000"
    }).setOrigin(0.5);

    const restartBtn = this.add.rectangle(width / 2, height / 2 + 40, 220, 70, 0x00aa00)
      .setInteractive();

    this.add.text(restartBtn.x, restartBtn.y, "RESTART", {
      fontSize: "26px",
      color: "#fff"
    }).setOrigin(0.5);

    restartBtn.on("pointerdown", () => {
      this.scene.restart();
    });
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

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
