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

    /* ========== SINGLE BACKGROUND (NO DUPLICATION) ========== */
    this.bg = this.add.tileSprite(
      width / 2,
      height / 2,
      width,
      height,
      "bg"
    ).setOrigin(0.5);

    /* ========== TITLE (CENTERED) ========== */
    this.add.text(
      width / 2,
      40,
      "2D BIKE SIMULATOR",
      {
        fontFamily: "Arial Black",
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6
      }
    ).setOrigin(0.5);

    /* ========== BIKE ========== */
    this.bike = this.physics.add.sprite(width / 2, height * 0.8, "bike");
    this.bike.setScale(0.5);
    this.bike.setCollideWorldBounds(true);

    /* ========== KEYBOARD CONTROLS (ADDED BACK) ========== */
    this.cursors = this.input.keyboard.createCursorKeys();

    /* ========== BUTTON STATES ========== */
    this.moveLeft = false;
    this.moveRight = false;

    /* ========== LEFT BUTTON ========== */
    const leftBtn = this.add.rectangle(80, height - 80, 120, 80, 0x000000, 0.6)
      .setInteractive();

    this.add.text(leftBtn.x, leftBtn.y, "LEFT", {
      fontSize: "20px",
      fill: "#fff"
    }).setOrigin(0.5);

    leftBtn.on("pointerdown", () => (this.moveLeft = true));
    leftBtn.on("pointerup", () => (this.moveLeft = false));
    leftBtn.on("pointerout", () => (this.moveLeft = false));

    /* ========== RIGHT BUTTON ========== */
    const rightBtn = this.add.rectangle(220, height - 80, 120, 80, 0x000000, 0.6)
      .setInteractive();

    this.add.text(rightBtn.x, rightBtn.y, "RIGHT", {
      fontSize: "20px",
      fill: "#fff"
    }).setOrigin(0.5);

    rightBtn.on("pointerdown", () => (this.moveRight = true));
    rightBtn.on("pointerup", () => (this.moveRight = false));
    rightBtn.on("pointerout", () => (this.moveRight = false));

    /* ========== HURDLES ========== */
    this.hurdles = this.physics.add.group();

    this.physics.add.overlap(
      this.bike,
      this.hurdles,
      this.gameOver,
      null,
      this
    );

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

    /* ========== BACKGROUND SCROLL (SINGLE IMAGE) ========== */
    this.bg.tilePositionY -= 4;

    /* ========== RESET BIKE ========== */
    this.bike.setVelocityX(0);
    this.bike.setRotation(0);

    /* ========== LEFT ========== */
    if (this.moveLeft || this.cursors.left.isDown) {
      this.bike.setVelocityX(-300);
      this.bike.setRotation(-0.12);
    }

    /* ========== RIGHT ========== */
    if (this.moveRight || this.cursors.right.isDown) {
      this.bike.setVelocityX(300);
      this.bike.setRotation(0.12);
    }

    /* ========== CLEANUP ========== */
    this.hurdles.children.iterate(h => {
      if (h && h.y > this.scale.height + 50) {
        h.destroy();
      }
    });
  }

  gameOver() {
    this.isGameOver = true;
    this.physics.pause();
    this.hurdleTimer.remove(false);

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      fill: "#ff0000"
    }).setOrigin(0.5);

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

/* ========== CONFIG ========== */
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

const game = new Phaser.Game(config);

window.addEventListener("resize", () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});
