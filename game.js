class BikeScene extends Phaser.Scene {
  constructor() {
    super("BikeScene");
  }

  preload() {
    this.load.image("bike", "assets/bike.png");
    this.load.image("bg", "assets/background.png");
    this.load.image("hurdle", "assets/hurdle.png");
  }

  create() {
    const { width, height } = this.scale;
    this.isGameOver = false;

    /* ================= BACKGROUND ================= */
    this.bg = this.add.tileSprite(
      width / 2,
      height / 2,
      width,
      height,
      "bg"
    );

    /* ================= BIKE ================= */
    this.bike = this.physics.add.sprite(width / 2, height * 0.8, "bike");
    this.bike.setScale(0.5);
    this.bike.setCollideWorldBounds(true);

    /* ================= HURDLES ================= */
    this.hurdles = this.physics.add.group();

    this.physics.add.overlap(
      this.bike,
      this.hurdles,
      this.gameOver,
      null,
      this
    );

    /* ================= BUTTON STATES ================= */
    this.moveLeft = false;
    this.moveRight = false;

    /* ================= LEFT BUTTON ================= */
    this.leftBtn = this.add.rectangle(
      80,
      height - 80,
      120,
      80,
      0x000000,
      0.6
    ).setInteractive();

    this.add.text(this.leftBtn.x, this.leftBtn.y, "LEFT", {
      fontSize: "20px",
      fill: "#fff"
    }).setOrigin(0.5);

    this.leftBtn.on("pointerdown", () => (this.moveLeft = true));
    this.leftBtn.on("pointerup", () => (this.moveLeft = false));
    this.leftBtn.on("pointerout", () => (this.moveLeft = false));

    /* ================= RIGHT BUTTON ================= */
    this.rightBtn = this.add.rectangle(
      220,
      height - 80,
      120,
      80,
      0x000000,
      0.6
    ).setInteractive();

    this.add.text(this.rightBtn.x, this.rightBtn.y, "RIGHT", {
      fontSize: "20px",
      fill: "#fff"
    }).setOrigin(0.5);

    this.rightBtn.on("pointerdown", () => (this.moveRight = true));
    this.rightBtn.on("pointerup", () => (this.moveRight = false));
    this.rightBtn.on("pointerout", () => (this.moveRight = false));

    /* ================= SPAWN HURDLES ================= */
    this.hurdleTimer = this.time.addEvent({
      delay: 1500,
      callback: this.spawnHurdle,
      callbackScope: this,
      loop: true
    });
  }

  spawnHurdle() {
    if (this.isGameOver) return;

    const x = Phaser.Math.Between(100, this.scale.width - 100);
    const hurdle = this.hurdles.create(x, -50, "hurdle");

    hurdle.setScale(0.5);
    hurdle.setVelocityY(300);
  }

  update() {
    if (this.isGameOver) return;

    /* ===== Scroll background ===== */
    this.bg.tilePositionY -= 4;

    /* ===== Reset bike ===== */
    this.bike.setVelocityX(0);
    this.bike.setRotation(0);

    /* ===== Left ===== */
    if (this.moveLeft) {
      this.bike.setVelocityX(-300);
      this.bike.setRotation(-0.15); // tilt left
    }

    /* ===== Right ===== */
    if (this.moveRight) {
      this.bike.setVelocityX(300);
      this.bike.setRotation(0.15); // tilt right
    }

    /* ===== Cleanup hurdles ===== */
    this.hurdles.children.iterate(hurdle => {
      if (hurdle && hurdle.y > this.scale.height + 50) {
        hurdle.destroy();
      }
    });
  }

  gameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.hurdleTimer.remove(false);

    const { width, height } = this.scale;

    this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.6
    );

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      fill: "#ff0000"
    }).setOrigin(0.5);

    /* ================= RESTART BUTTON ================= */
    const restartBtn = this.add.rectangle(
      width / 2,
      height / 2 + 40,
      200,
      60,
      0x00aa00,
      0.8
    ).setInteractive();

    this.add.text(restartBtn.x, restartBtn.y, "RESTART", {
      fontSize: "24px",
      fill: "#fff"
    }).setOrigin(0.5);

    restartBtn.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}

/* ================= GAME CONFIG ================= */
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: "#000",
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BikeScene]
};

const game = new Phaser.Game(config);

/* ================= RESIZE ================= */
window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
