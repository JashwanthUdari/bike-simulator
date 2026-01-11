class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    this.load.image("bg_day_laptop", "assets/background_day_laptop.png");
    this.load.image("bg_day_mobile", "assets/background_day_mobile.png");
    this.load.image("bg_night_laptop", "assets/background_night_laptop.png");
    this.load.image("bg_night_mobile", "assets/background_night_mobile.png");

    this.load.image("bike_day", "assets/bikeday.png");
    this.load.image("bike_night", "assets/bikenight.png");
    this.load.image("car", "assets/car.png");

    this.load.audio("music", "assets/bg-music.mp3");
  }

  create() {
    const { width, height } = this.scale;

    /* ------------------ STATE ------------------ */
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;
    this.isNight = false;
    this.speed = 200;
    this.score = 0;
    this.gameOver = false;

    /* ------------------ BACKGROUND ------------------ */
    this.bgKey = this.getBackgroundKey();
    this.background = this.add.image(width / 2, height / 2, this.bgKey);
    this.background.setDisplaySize(width, height);

    this.bgY = 0;

    /* ------------------ TITLE ------------------ */
    this.titleText = this.add.text(
      width / 2,
      20,
      "2D BIKE SIMULATOR",
      {
        fontSize: "32px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }
    ).setOrigin(0.5, 0);

    /* ------------------ BIKE ------------------ */
    this.bike = this.physics.add.sprite(width / 2, height * 0.75, "bike_day");
    this.bike.setScale(0.4);
    this.bike.setCollideWorldBounds(true);

    /* ------------------ CARS ------------------ */
    this.cars = this.physics.add.group();

    this.carTimer = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: this.spawnCar,
      callbackScope: this
    });

    /* ------------------ COLLISION ------------------ */
    this.physics.add.overlap(this.bike, this.cars, this.hitCar, null, this);

    /* ------------------ CONTROLS ------------------ */
    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.on("pointerdown", (pointer) => {
      if (pointer.x < width / 2) {
        this.bike.setVelocityX(-300);
      } else {
        this.bike.setVelocityX(300);
      }
    });

    this.input.on("pointerup", () => {
      this.bike.setVelocityX(0);
    });

    /* ------------------ SCORE ------------------ */
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "20px",
      color: "#ffffff"
    });

    /* ------------------ MUSIC ------------------ */
    this.music = this.sound.add("music", { loop: true, volume: 0.4 });
    this.music.play();

    /* ------------------ DAY / NIGHT SWITCH ------------------ */
    this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: this.toggleDayNight,
      callbackScope: this
    });
  }

  getBackgroundKey() {
    if (this.isNight) {
      return this.isMobile ? "bg_night_mobile" : "bg_night_laptop";
    } else {
      return this.isMobile ? "bg_day_mobile" : "bg_day_laptop";
    }
  }

  toggleDayNight() {
    this.isNight = !this.isNight;

    this.background.setTexture(this.getBackgroundKey());
    this.bike.setTexture(this.isNight ? "bike_night" : "bike_day");
  }

  spawnCar() {
    if (this.gameOver) return;

    const lanes = [0.35, 0.5, 0.65];
    const laneX = lanes[Math.floor(Math.random() * lanes.length)] * this.scale.width;

    const car = this.cars.create(laneX, -50, "car");
    car.setScale(0.25);
    car.setVelocityY(this.speed);
    car.setImmovable(true);
  }

  hitCar() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.physics.pause();
    this.music.stop();

    if (navigator.vibrate) navigator.vibrate(300);

    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40,
      "Well tried.\nStart again for your best score",
      {
        fontSize: "26px",
        align: "center",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
      }
    ).setOrigin(0.5);

    const restartBtn = this.add.text(width / 2, height / 2 + 40,
      "RESTART",
      {
        fontSize: "28px",
        backgroundColor: "#00aa00",
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5).setInteractive();

    restartBtn.on("pointerdown", () => {
      this.scene.restart();
    });
  }

  update(_, delta) {
    if (this.gameOver) return;

    /* -------- Background Scroll -------- */
    this.bgY += this.speed * delta / 1000;
    if (this.bgY >= this.scale.height) this.bgY = 0;
    this.background.y = this.scale.height / 2 + this.bgY;

    /* -------- Keyboard -------- */
    if (this.cursors.left.isDown) {
      this.bike.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.bike.setVelocityX(300);
    } else {
      this.bike.setVelocityX(0);
    }

    /* -------- Score -------- */
    this.score += delta * 0.01;
    this.scoreText.setText("Score: " + Math.floor(this.score));
  }
}

/* ------------------ GAME CONFIG ------------------ */
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BikeScene]
};

new Phaser.Game(config);
