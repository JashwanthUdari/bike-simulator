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
    this.isStarted = false; // 🔑 START CONTROL

    /* ================= LEVEL SYSTEM ================= */
    this.level = 1;
    this.baseCarSpeed = 260;
    this.speedIncrement = 50;

    const { width, height } = this.scale;
    this.isMobile =
      this.sys.game.device.os.android ||
      this.sys.game.device.os.iOS;

    /* ================= ROAD ================= */
    this.roadCenter = width / 2;
    this.roadWidth = width * 0.28;
    this.roadLeft = this.roadCenter - this.roadWidth / 2;
    this.roadRight = this.roadCenter + this.roadWidth / 2;

    /* 🔧 LANE ADJUSTMENT */
    this.leftLaneOffset   = 0.35;
    this.middleLaneOffset = 0.0;
    this.rightLaneOffset  = 0.25;

    this.lanes = [
      this.roadCenter - this.roadWidth * this.leftLaneOffset,
      this.roadCenter + this.roadWidth * this.middleLaneOffset,
      this.roadCenter + this.roadWidth * this.rightLaneOffset
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
      if (!this.isStarted) return;
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
      paused: true, // 🔑 WAIT FOR START
      callback: () => {
        if (this.isGameOver) return;

        const laneX = Phaser.Utils.Array.GetRandom(this.lanes);
        const key = this.isNight ? "car_night" : "car_day";

        const car = this.cars.create(laneX, -80, key);
        car.setScale(0.30);
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
      delay: 20000,
      loop: true,
      paused: true,
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
      paused: true,
      callback: this.toggleDayNight,
      callbackScope: this
    });

    /* ================= START SCREEN ================= */
    this.showStartScreen();
  }

  showStartScreen() {
    const { width, height } = this.scale;

    this.startPanel = this.add.container(width / 2, height / 2);

    const bg = this.add.rectangle(0, 0, 360, 220, 0xffffff, 0.85)
      .setStrokeStyle(2, 0xcccccc);

    const title = this.add.text(0, -60,
      "Welcome Rider 🏍",
      { fontSize: "24px", color: "#333333" }
    ).setOrigin(0.5);

    const note = this.add.text(0, -20,
      "Avoid traffic. Survive",
      { fontSize: "16px", color: "#333333", align: "center", wordWrap: { width: 300 } }
    ).setOrigin(0.5);

    const startBtn = this.add.text(0, 40, "START", {
      fontSize: "22px",
      backgroundColor: "#00aa00",
      padding: { x: 30, y: 12 },
      color: "#ffffff"
    }).setOrigin(0.5).setInteractive();

    startBtn.on("pointerdown", () => {
      this.startPanel.destroy();
      this.startGame();
    });

    this.startPanel.add([bg, title, note, startBtn]);

    this.startPanel.setScale(0.6).setAlpha(0);
    this.tweens.add({
      targets: this.startPanel,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: "Back.Out"
    });
  }

  startGame() {
    this.isStarted = true;
    this.music.play();
    this.carTimer.paused = false;
    this.levelTimer.paused = false;
    this.time.events.forEach(e => e.paused = false);
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

    const bg = this.add.rectangle(0, 0, 400, 270, 0xffffff, 0.92)
    .setStrokeStyle(2, 0xcccccc);
  
  const t1 = this.add.text(0, -80, "Well tried.", {
    fontSize: "26px",
    color: "#333333"
  }).setOrigin(0.5);
  
  const t2 = this.add.text(0, -40,
    `Your score: ${Math.floor(this.score)}`,
    {
      fontSize: "22px",
      color: "#333333"
    }
  ).setOrigin(0.5);
  
  const t3 = this.add.text(0, 20,
    "Be an Indian driver\nExpect the unexpected traffic 😉",
    {
      fontSize: "18px",
      color: "#333333",
      align: "center",
      lineSpacing: 12,          // ✅ spacing between wrapped lines
      wordWrap: { width: 320 }
    }
  ).setOrigin(0.5);
  
  const restart = this.add.text(0, 80, "RESTART", {
    fontSize: "22px",
    backgroundColor: "#00aa00",
    padding: { x: 26, y: 12 },
    color: "#ffffff"
  }).setOrigin(0.5).setInteractive();
  
  restart.on("pointerdown", () => this.scene.restart());
  
    panel.add([bg, t1, t2, t3, restart]);  
    panel.setScale(0.6).setAlpha(0); //Unchanged

    this.tweens.add({
      targets: panel,
      scale: 1,
      alpha: 1,
      duration: 400,
      ease: "Back.Out"
    });
  }

  update() {
    if (!this.isStarted || this.isGameOver) return;

    const scrollSpeed = 4;
    this.bg1.y += scrollSpeed;
    this.bg2.y += scrollSpeed;

    if (this.bg1.y >= this.scale.height)
      this.bg1.y = this.bg2.y - this.scale.height;

    if (this.bg2.y >= this.scale.height)
      this.bg2.y = this.bg1.y - this.scale.height;

    this.score += 0.1;
    this.scoreText.setText("Score: " + Math.floor(this.score));

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
