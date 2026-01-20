class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    /* ================= BACKGROUNDS ================= */
    this.load.image("bg_day_laptop", "assets/background_day_laptop.png");
    this.load.image("bg_night_laptop", "assets/background_night_laptop.png");
    this.load.image("bg_day_mobile", "assets/background_day_mobile.png");
    this.load.image("bg_night_mobile", "assets/background_night_mobile.png");

    /* ================= VEHICLES ================= */
    this.load.image("bike_day", "assets/bikeday.png");
    this.load.image("bike_night", "assets/bikenight.png");
    this.load.image("car_day", "assets/car.png");
    this.load.image("car_night", "assets/car_night.png");

    /* ================= AUDIO ================= */
    this.load.audio("music", "assets/bg-music.mp3");
    this.load.audio("crash", "assets/shit.mp3");
  }

  create() {
    /* ================= FLAGS ================= */
    this.isGameOver = false;
    this.isNight = false;
    this.score = 0;

    const { width, height } = this.scale;
    this.isMobile =
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;

    /* ================= BACKGROUND ================= */
    this.bgKey = this.isMobile ? "bg_day_mobile" : "bg_day_laptop";

    this.bg = this.add.image(width / 2, height / 2, this.bgKey)
      .setDisplaySize(width, height)
      .setDepth(-10);

    /* ================= MUSIC ================= */
    this.music = this.sound.add("music", { loop: true, volume: 0.5 });
    this.music.play();

    this.crashSound = this.sound.add("crash", { volume: 1 });

    /* ================= TITLE ================= */
    this.add.text(width / 2, 30, "2D BIKE SIMULATOR", {
      fontSize: "32px",
      fontStyle: "bold",
      color: "#333333"
    }).setOrigin(0.5);

    /* ================= SCORE ================= */
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "18px",
      color: "#333333"
    });

    /* ================= ROAD BOUNDS ================= */
    // 🔧 Adjust ONLY these if road width changes
    this.roadLeft = width * 0.38;
    this.roadRight = width * 0.62;
    this.roadCenter = (this.roadLeft + this.roadRight) / 2;

    /* ================= LANES ================= */
    this.lanes = [
      Phaser.Math.Linear(this.roadLeft, this.roadCenter, 0.5),
      Phaser.Math.Linear(this.roadCenter, this.roadRight, 0.5)
    ];

    /* ================= BIKE ================= */
    this.bike = this.physics.add.sprite(
      this.roadCenter,
      height * 0.8,
      "bike_day"
    );
    this.bike.setScale(0.22); // 🔧 BIKE SIZE
    this.bike.setCollideWorldBounds(false);

    /* ================= INPUT ================= */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.turnDirection = 0;

    this.input.on("pointerdown", p => {
      this.turnDirection = p.x < width / 2 ? -1 : 1;
    });

    this.input.on("pointerup", () => {
      this.turnDirection = 0;
    });

    /* ================= CARS ================= */
    this.cars = this.physics.add.group();

    this.carTimer = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        if (this.isGameOver) return;

        const laneX = Phaser.Utils.Array.GetRandom(this.lanes);
        const carKey = this.isNight ? "car_night" : "car_day";

        const car = this.cars.create(laneX, -100, carKey);
        car.setScale(0.18); // 🔧 CAR SIZE
        car.setVelocityY(260);
      }
    });

    this.physics.add.overlap(
      this.bike,
      this.cars,
      this.handleCrash,
      null,
      this
    );

    /* ================= GUIDE ================= */
    this.guide = this.add.text(
      width / 2,
      height / 2,
      "← LEFT     RIGHT →",
      { fontSize: "26px", color: "#333333" }
    ).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: this.guide,
        alpha: 0,
        duration: 500,
        onComplete: () => this.guide.destroy()
      });
    });

    /* ================= DAY/NIGHT SWITCH ================= */
    this.time.addEvent({
      delay: 20000,
      loop: true,
      callback: this.toggleDayNight,
      callbackScope: this
    });
  }

  toggleDayNight() {
    if (this.isGameOver) return;

    this.isNight = !this.isNight;

    const bgKey = this.isMobile
      ? this.isNight ? "bg_night_mobile" : "bg_day_mobile"
      : this.isNight ? "bg_night_laptop" : "bg_day_laptop";

    this.bg.setTexture(bgKey);
    this.bg.setDisplaySize(this.scale.width, this.scale.height);
    this.bike.setTexture(this.isNight ? "bike_night" : "bike_day");
  }

  handleCrash() {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.music.stop();
    this.crashSound.play();
    this.carTimer.remove(false);

    this.cars.setVelocityY(0);
    if (navigator.vibrate) navigator.vibrate(300);

    const { width, height } = this.scale;

    this.add.text(
      width / 2,
      height / 2 - 40,
      `Well tried.\nYour score: ${Math.floor(this.score)}`,
      {
        fontSize: "22px",
        color: "#333333",
        align: "center"
      }
    ).setOrigin(0.5);

    const restart = this.add.text(
      width / 2,
      height / 2 + 40,
      "RESTART",
      {
        fontSize: "22px",
        backgroundColor: "#00aa00",
        padding: { x: 20, y: 10 },
        color: "#ffffff"
      }
    ).setOrigin(0.5).setInteractive();

    restart.on("pointerdown", () => this.scene.restart());
  }

  update() {
    if (this.isGameOver) return;

    /* ================= BACKGROUND SCROLL ================= */
    this.bg.y += 4;
    if (this.bg.y >= this.scale.height / 2 + 20) {
      this.bg.y = this.scale.height / 2;
    }

    /* ================= SCORE ================= */
    this.score += 0.1;
    this.scoreText.setText("Score: " + Math.floor(this.score));

    /* ================= MOVEMENT ================= */
    let dir = 0;
    if (this.cursors.left.isDown) dir = -1;
    else if (this.cursors.right.isDown) dir = 1;
    else dir = this.turnDirection;

    const speed = this.isMobile ? 7 : 4;
    this.bike.x += dir * speed;

    /* ================= BIKE LIMIT ================= */
    this.bike.x = Phaser.Math.Clamp(
      this.bike.x,
      this.roadLeft + 20,
      this.roadRight - 20
    );

    /* ================= BIKE TILT ================= */
    this.bike.rotation = Phaser.Math.Linear(
      this.bike.rotation,
      dir * 0.25,
      0.1
    );
  }
}

/* ================= GAME CONFIG ================= */
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: BikeScene,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
