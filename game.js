class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    this.load.image("bg_day_laptop", "assets/background_day_laptop.png");
    this.load.image("bg_night_laptop", "assets/background_night_laptop.png");
    this.load.image("bg_day_mobile", "assets/background_day_mobile.png");
    this.load.image("bg_night_mobile", "assets/background_night_mobile.png");

    this.load.image("bike_day", "assets/bikeday.png");
    this.load.image("bike_night", "assets/bikenight.png");
    this.load.image("car_day", "assets/car.png");
    this.load.image("car_night", "assets/car_night.png");

    this.load.audio("music", "assets/bg-music.mp3");
  }

  create() {
    /* ================= FLAGS ================= */
    this.isGameOver = false;
    this.isNight = false;
    this.score = 0;

    /* ================= LEVEL SYSTEM ================= */
    this.level = 1;
    this.baseCarSpeed = 260;   // starting speed
    this.speedIncrement = 40;  // speed added every level

    const { width, height } = this.scale;
    this.isMobile =
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;

    /* ================= ROAD ================= */
    this.roadCenter = width / 2;
    this.roadWidth = width * 0.28;
    this.roadLeft = this.roadCenter - this.roadWidth / 2;
    this.roadRight = this.roadCenter + this.roadWidth / 2;

    this.lanes = [
      this.roadCenter - this.roadWidth * 0.25,
      this.roadCenter + this.roadWidth * 0.25
    ];

    /* ================= BACKGROUND LOOP ================= */
    this.bgKey = this.isMobile ? "bg_day_mobile" : "bg_day_laptop";

    this.bg1 = this.add.image(width / 2, 0, this.bgKey)
      .setOrigin(0.5, 0)
      .setDisplaySize(width, height);

    this.bg2 = this.add.image(width / 2, -height, this.bgKey)
      .setOrigin(0.5, 0)
      .setDisplaySize(width, height);

    /* ================= MUSIC ================= */
    this.music = this.sound.add("music", { loop: true, volume: 0.5 });
    this.music.play();

    /* ================= UI ================= */
    this.add.text(width / 2, 30, "2D BIKE SIMULATOR", {
      fontSize: "32px",
      fontStyle: "bold",
      color: "#333333"
    }).setOrigin(0.5);

    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "18px",
      color: "#f8f3f3"
    });

    this.levelText = this.add.text(20, 45, "Level: 1", {
      fontSize: "16px",
      color: "#f8f3f3"
    });

    /* ================= BIKE ================= */
    this.bike = this.physics.add.sprite(
      this.roadCenter,
      height * 0.8,
      "bike_day"
    );
    this.bike.setScale(0.20);

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
        const key = this.isNight ? "car_night" : "car_day";

        const car = this.cars.create(laneX, -80, key);
        car.setScale(0.33);
        car.setVelocityY(this.baseCarSpeed);
      }
    });

    this.physics.add.overlap(
      this.bike,
      this.cars,
      this.handleCrash,
      null,
      this
    );

    /* ================= LEVEL TIMER ================= */
    this.levelTimer = this.time.addEvent({
      delay: 20000, // 20 seconds
      loop: true,
      callback: () => {
        this.level++;
        this.baseCarSpeed += this.speedIncrement;
        this.levelText.setText("Level: " + this.level);
      }
    });

    /* ================= DAY / NIGHT ================= */
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

    this.bgKey = this.isMobile
      ? (this.isNight ? "bg_night_mobile" : "bg_day_mobile")
      : (this.isNight ? "bg_night_laptop" : "bg_day_laptop");

    this.bg1.setTexture(this.bgKey);
    this.bg2.setTexture(this.bgKey);
    this.bike.setTexture(this.isNight ? "bike_night" : "bike_day");

    this.cars.getChildren().forEach(c =>
      c.setTexture(this.isNight ? "car_night" : "car_day")
    );
  }

  handleCrash() {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.music.stop();
    this.carTimer.remove(false);
    this.levelTimer.remove(false);
    this.cars.setVelocityY(0);

    const { width, height } = this.scale;

    const panel = this.add.container(width / 2, height / 2);

    const t1 = this.add.text(0, -80, "Well tried.", {
      fontSize: "26px",
      color: "#f8f3f3"
    }).setOrigin(0.5);

    const t2 = this.add.text(0, -40,
      `Your score: ${Math.floor(this.score)}`,
      { fontSize: "22px", color: "#f8f3f3" }
    ).setOrigin(0.5);

    const t3 = this.add.text(
      0, 0,
      "Don't compare just beat your own score",
      {
        fontSize: "18px",
        color: "#f8f3f3",
        align: "center",
        wordWrap: { width: 320 }
      }
    ).setOrigin(0.5);

    const restart = this.add.text(0, 60, "RESTART", {
      fontSize: "22px",
      backgroundColor: "#00aa00",
      padding: { x: 24, y: 10 },
      color: "#ffffff"
    }).setOrigin(0.5).setInteractive();

    restart.on("pointerdown", () => this.scene.restart());

    panel.add([t1, t2, t3, restart]);
  }

  update() {
    if (this.isGameOver) return;

    /* BACKGROUND LOOP */
    const scrollSpeed = 4;
    this.bg1.y += scrollSpeed;
    this.bg2.y += scrollSpeed;

    if (this.bg1.y >= this.scale.height) {
      this.bg1.y = this.bg2.y - this.scale.height;
    }
    if (this.bg2.y >= this.scale.height) {
      this.bg2.y = this.bg1.y - this.scale.height;
    }

    /* SCORE */
    this.score += 0.1;
    this.scoreText.setText("Score: " + Math.floor(this.score));

    /* BIKE MOVE */
    let dir = 0;
    if (this.cursors.left.isDown) dir = -1;
    else if (this.cursors.right.isDown) dir = 1;
    else dir = this.turnDirection;

    const speed = this.isMobile ? 6 : 4;
    this.bike.x += dir * speed;

    this.bike.x = Phaser.Math.Clamp(
      this.bike.x,
      this.roadLeft + 20,
      this.roadRight - 20
    );

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
  physics: { default: "arcade", arcade: { debug: false } },
  scene: BikeScene,
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
};

new Phaser.Game(config);
