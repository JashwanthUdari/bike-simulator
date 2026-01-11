class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    this.load.image("bikeday", "assets/bikeday.png");
    this.load.image("bikenight", "assets/bikenight.png");
    this.load.image("car", "assets/car.png");

    const isMobile = window.innerWidth < 768;
    this.load.image("bgDay", isMobile
      ? "assets/background_day_mobile.png"
      : "assets/background_day_laptop.png");

    this.load.image("bgNight", isMobile
      ? "assets/background_night_mobile.png"
      : "assets/background_night_laptop.png");

    this.load.audio("music", "assets/bg-music.mp3");
  }

  create() {
    const { width, height } = this.scale;

    /* ---------- STATE ---------- */
    this.speed = 200;
    this.score = 0;
    this.isNight = false;
    this.gameOver = false;

    /* ---------- BACKGROUND ---------- */
    this.bg1 = this.add.image(0, 0, "bgDay").setOrigin(0);
    this.bg2 = this.add.image(0, -height, "bgDay").setOrigin(0);

    this.bg1.setDisplaySize(width, height);
    this.bg2.setDisplaySize(width, height);

    /* ---------- TITLE ---------- */
    this.title = this.add.text(
      width / 2,
      20,
      "2D BIKE SIMULATOR",
      { fontSize: "32px", color: "#fff", fontStyle: "bold" }
    ).setOrigin(0.5);

    /* ---------- BIKE ---------- */
    this.bike = this.physics.add.sprite(width / 2, height * 0.75, "bikeday");
    this.bike.setScale(0.35);
    this.bike.setCollideWorldBounds(true);

    /* ---------- CONTROLS ---------- */
    this.cursors = this.input.keyboard.createCursorKeys();

    this.leftPressed = false;
    this.rightPressed = false;

    this.input.on("pointerdown", p => {
      if (p.x < width / 2) this.leftPressed = true;
      else this.rightPressed = true;
    });

    this.input.on("pointerup", () => {
      this.leftPressed = false;
      this.rightPressed = false;
    });

    /* ---------- GUIDE ---------- */
    const guide = this.add.text(
      width / 2,
      height / 2,
      "← LEFT SIDE TO TURN LEFT\nRIGHT SIDE TO TURN RIGHT →",
      { fontSize: "22px", align: "center", color: "#fff" }
    ).setOrigin(0.5);

    this.tweens.add({
      targets: guide,
      alpha: 0,
      duration: 3000,
      onComplete: () => guide.destroy()
    });

    /* ---------- SCORE ---------- */
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "20px",
      color: "#fff"
    });

    /* ---------- CARS ---------- */
    this.cars = this.physics.add.group();

    this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: this.spawnCar,
      callbackScope: this
    });

    this.physics.add.overlap(this.bike, this.cars, this.crash, null, this);

    /* ---------- MUSIC ---------- */
    this.music = this.sound.add("engine", { loop: true, volume: 0.4 });
    this.music.play();

    /* ---------- LIGHTS ---------- */
    this.lights.enable();
    this.lights.setAmbientColor(0x999999);

    this.bikeLight = this.lights.addLight(
      this.bike.x,
      this.bike.y,
      220,
      0xffffff,
      2
    );

    /* ---------- DAY / NIGHT ---------- */
    this.time.addEvent({
      delay: 60000,
      loop: true,
      callback: this.toggleDayNight,
      callbackScope: this
    });
  }

  spawnCar() {
    if (this.gameOver) return;

    const { width } = this.scale;
    const lanes = [width * 0.3, width * 0.5, width * 0.7];
    const x = Phaser.Utils.Array.GetRandom(lanes);

    const car = this.cars.create(x, -100, "car");
    car.setScale(0.25);
    car.setVelocityY(this.speed + 80);

    if (this.isNight) {
      car.setPipeline("Light2D");
      car.light = this.lights.addLight(x, car.y + 20, 150, 0xfff2cc, 1.3);
    }
  }

  toggleDayNight() {
    this.isNight = !this.isNight;

    this.bg1.setTexture(this.isNight ? "bgNight" : "bgDay");
    this.bg2.setTexture(this.isNight ? "bgNight" : "bgDay");
    this.bike.setTexture(this.isNight ? "bikenight" : "bikeday");

    this.lights.setAmbientColor(this.isNight ? 0x333333 : 0x999999);
  }

  crash() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.music.stop();
    if (navigator.vibrate) navigator.vibrate(300);

    this.physics.pause();

    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40,
      "Well tried.",
      { fontSize: "32px", color: "#fff" }
    ).setOrigin(0.5);

    this.add.text(width / 2, height / 2,
      "Start again for your best score",
      { fontSize: "20px", color: "#fff" }
    ).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 50,
      `Score: ${this.score}`,
      { fontSize: "24px", color: "#0f0" }
    ).setOrigin(0.5);

    this.input.once("pointerdown", () => this.scene.restart());
  }

  update() {
    if (this.gameOver) return;

    const { width, height } = this.scale;

    /* Background scroll */
    this.bg1.y += this.speed * 0.016;
    this.bg2.y += this.speed * 0.016;

    if (this.bg1.y >= height) this.bg1.y = this.bg2.y - height;
    if (this.bg2.y >= height) this.bg2.y = this.bg1.y - height;

    /* Movement */
    let turn = 0;
    if (this.leftPressed || this.cursors.left.isDown) turn = -1;
    if (this.rightPressed || this.cursors.right.isDown) turn = 1;

    this.bike.setVelocityX(turn * 220);
    this.bike.rotation = Phaser.Math.Clamp(turn * 0.2, -0.25, 0.25);

    /* Lights */
    this.bikeLight.x = this.bike.x;
    this.bikeLight.y = this.bike.y;

    /* Cars cleanup & scoring */
    this.cars.getChildren().forEach(car => {
      if (car.y > height + 100) {
        this.score += 2;
        this.scoreText.setText("Score: " + this.score);
        if (car.light) this.lights.removeLight(car.light);
        car.destroy();
      } else if (Math.abs(car.x - this.bike.x) < 40 && Math.abs(car.y - this.bike.y) < 80) {
        this.score += 5; // near miss
      }
    });
  }
}

/* ---------- GAME CONFIG ---------- */
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

const game = new Phaser.Game(config);
window.addEventListener("resize", () =>
  game.scale.resize(window.innerWidth, window.innerHeight)
);
