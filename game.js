class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    // ===== BACKGROUNDS =====
    this.load.image("bg_day_laptop", "assets/background_day_laptop.png");
    this.load.image("bg_night_laptop", "assets/background_night_laptop.png");
    this.load.image("bg_day_mobile", "assets/background_day_mobile.png");
    this.load.image("bg_night_mobile", "assets/background_night_mobile.png");

    // ===== BIKE =====
    this.load.image("bikeday", "assets/bikeday.png");
    this.load.image("bikenight", "assets/bikenight.png");

    // ===== CAR =====
    this.load.image("car", "assets/car.png");

    // ===== MUSIC =====
    this.load.audio("bgmusic", "assets/bg-music.mp3");
  }

  create() {
    const { width, height } = this.scale;

    // ===== DEVICE CHECK =====
    this.isMobile = this.sys.game.device.os.android || this.sys.game.device.os.iOS;

    // ===== DAY / NIGHT STATE =====
    this.isNight = false;

    // ===== BACKGROUND =====
    const bgKey = this.isMobile ? "bg_day_mobile" : "bg_day_laptop";
    this.bg = this.add.image(width / 2, height / 2, bgKey);
    this.bg.setDisplaySize(width, height);

    // ===== MUSIC =====
    this.music = this.sound.add("bgmusic", { loop: true, volume: 0.5 });
    this.music.play();

    // ===== LIGHTS =====
    this.lights.enable();
    this.lights.setAmbientColor(0xffffff);

    // ===== TITLE =====
    this.titleText = this.add.text(width / 2, 40, "2D BIKE SIMULATOR", {
      fontSize: "32px",
      fontStyle: "bold",
      color: "#333333"
    }).setOrigin(0.5);

    // ===== SCORE =====
    this.score = 0;
    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "18px",
      color: "#ffffff"
    });

    // ===== BIKE =====
    this.bike = this.physics.add.sprite(width / 2, height * 0.75, "bikeday");
    this.bike.setScale(0.30); // 🔧 BIKE SIZE (change here)
    this.bike.setCollideWorldBounds(true);
    this.bike.setPipeline("Light2D");

    // Bike light (night only)
    this.bikeLight = this.lights.addLight(this.bike.x, this.bike.y, 250, 0xffffff, 1.5);

    // ===== CONTROLS =====
    this.cursors = this.input.keyboard.createCursorKeys();

    this.turnLeft = false;
    this.turnRight = false;

    // Touch controls (split screen)
    this.input.on("pointerdown", (p) => {
      if (p.x < width / 2) this.turnLeft = true;
      else this.turnRight = true;
    });

    this.input.on("pointerup", () => {
      this.turnLeft = false;
      this.turnRight = false;
    });

    // ===== GUIDE (3 seconds) =====
    this.guideLeft = this.add.text(width * 0.25, height / 2, "←", {
      fontSize: "80px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.guideRight = this.add.text(width * 0.75, height / 2, "→", {
      fontSize: "80px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: [this.guideLeft, this.guideRight],
        alpha: 0,
        duration: 1000
      });
    });

    // ===== CARS =====
    this.cars = this.physics.add.group();

    this.time.addEvent({
      delay: 1200, // 🔧 CAR SPAWN RATE
      loop: true,
      callback: this.spawnCar,
      callbackScope: this
    });

    this.physics.add.overlap(this.bike, this.cars, this.gameOver, null, this);

    // ===== DAY / NIGHT SWITCH (30s) =====
    this.time.addEvent({
      delay: 30000,
      loop: true,
      callback: this.toggleDayNight,
      callbackScope: this
    });
  }

  spawnCar() {
    const { width } = this.scale;

    const x = Phaser.Math.Between(width * 0.3, width * 0.7);
    const car = this.cars.create(x, -50, "car");

    car.setScale(0.32); // 🔧 CAR SIZE
    car.setVelocityY(300);
    car.setPipeline("Light2D");

    // Headlight
    car.light = this.lights.addLight(car.x, car.y, 180, 0xfff2cc, 1);

    car.update = () => {
      car.light.x = car.x;
      car.light.y = car.y;
    };
  }

  toggleDayNight() {
    const { width, height } = this.scale;

    this.isNight = !this.isNight;

    const bgKey = this.isMobile
      ? (this.isNight ? "bg_night_mobile" : "bg_day_mobile")
      : (this.isNight ? "bg_night_laptop" : "bg_day_laptop");

    this.tweens.add({
      targets: this.bg,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        this.bg.setTexture(bgKey);
        this.bg.setDisplaySize(width, height);
        this.tweens.add({ targets: this.bg, alpha: 1, duration: 800 });
      }
    });

    this.bike.setTexture(this.isNight ? "bikenight" : "bikeday");

    this.lights.setAmbientColor(this.isNight ? 0x555555 : 0xffffff);
  }

  update() {
    const speed = this.isMobile ? 8 : 5; // 🔧 TURN SENSITIVITY

    // Keyboard
    if (this.cursors.left.isDown || this.turnLeft) {
      this.bike.x -= speed;
      this.bike.rotation = -0.2; // 🔧 TILT
    } else if (this.cursors.right.isDown || this.turnRight) {
      this.bike.x += speed;
      this.bike.rotation = 0.2;
    } else {
      this.bike.rotation *= 0.9; // smooth reset
    }

    // Update lights
    this.bikeLight.x = this.bike.x;
    this.bikeLight.y = this.bike.y - 30;

    // Update cars
    this.cars.children.iterate((car) => {
      if (!car) return;
      car.update();
      if (car.y > this.scale.height + 50) {
        this.score += 2;
        this.scoreText.setText("Score: " + this.score);
        this.lights.removeLight(car.light);
        car.destroy();
      }
    });
  }

  gameOver() {
    this.physics.pause();
    this.music.stop();

    if (navigator.vibrate) navigator.vibrate(300);

    const { width, height } = this.scale;

    this.add.text(width / 2, height / 2 - 40, "Well tried.", {
      fontSize: "28px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2, "Start again for your best score", {
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);

    const btn = this.add.text(width / 2, height / 2 + 50, "RESTART", {
      fontSize: "20px",
      backgroundColor: "#00aa00",
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    btn.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade"
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: BikeScene
};

new Phaser.Game(config);
