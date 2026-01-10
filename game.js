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
    this.load.image("hurdle", "assets/hurdle.png");
  }

  create() {
    const { width, height } = this.scale;

    this.speed = 4;
    this.isGameOver = false;

    /* ========= BACKGROUND (2-image scroll) ========= */
    this.bg1 = this.add.image(width / 2, height / 2, this.bgKey)
      .setDisplaySize(width, height);

    this.bg2 = this.add.image(width / 2, -height / 2, this.bgKey)
      .setDisplaySize(width, height);

    /* ========= CENTER TITLE ========= */
    this.add.text(
      width / 2,
      30,
      "2D BIKE SIMULATOR",
      {
        fontFamily: "Arial Black",
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6
      }
    ).setOrigin(0.5, 0);

    /* ========= BIKE ========= */
    this.bike = this.physics.add.sprite(width / 2, height * 0.78, "bike");
    this.bike.setScale(0.30); //Bike size
    this.bike.setDepth(5);
    this.bike.setCollideWorldBounds(true);

    /* ========= INPUT ========= */
    this.cursors = this.input.keyboard.createCursorKeys();
    this.moveLeft = false;
    this.moveRight = false;

    this.createButtons();

    /* ========= HURDLES ========= */
    this.hurdles = this.physics.add.group();

    this.physics.add.overlap(
      this.bike,
      this.hurdles,
      this.gameOver,
      null,
      this
    );

    this.time.addEvent({
      delay: 1600,
      callback: this.spawnHurdle,
      callbackScope: this,
      loop: true
    });
  }

  createButtons() {
    const { width, height } = this.scale;

    /* LEFT BUTTON */
    const leftBtn = this.add.rectangle(
      100,
      height - 90,
      160,
      100,
      0x000000,
      0.6
    ).setInteractive();

    this.add.text(leftBtn.x, leftBtn.y, "LEFT", {
      fontSize: "24px",
      color: "#fff"
    }).setOrigin(0.5);

    leftBtn.on("pointerdown", () => this.moveLeft = true);
    leftBtn.on("pointerup", () => this.moveLeft = false);
    leftBtn.on("pointerout", () => this.moveLeft = false);

    /* RIGHT BUTTON */
    const rightBtn = this.add.rectangle(
      width - 100,
      height - 90,
      160,
      100,
      0x000000,
      0.6
    ).setInteractive();

    this.add.text(rightBtn.x, rightBtn.y, "RIGHT", {
      fontSize: "24px",
      color: "#fff"
    }).setOrigin(0.5);

    rightBtn.on("pointerdown", () => this.moveRight = true);
    rightBtn.on("pointerup", () => this.moveRight = false);
    rightBtn.on("pointerout", () => this.moveRight = false);
  }

  spawnHurdle() {
    if (this.isGameOver) return;

    const x = Phaser.Math.Between(120, this.scale.width - 120);
    const hurdle = this.hurdles.create(x, -50, "hurdle");

    hurdle.setScale(0.45); // smaller hurdle
    hurdle.setVelocityY(320);
  }

  update() {
    if (this.isGameOver) return;

    /* ========= BACKGROUND SCROLL ========= */
    this.bg1.y += this.speed;
    this.bg2.y += this.speed;

    if (this.bg1.y >= this.scale.height * 1.5) {
      this.bg1.y = this.bg2.y - this.scale.height;
    }

    if (this.bg2.y >= this.scale.height * 1.5) {
      this.bg2.y = this.bg1.y - this.scale.height;
    }

    /* ========= BIKE CONTROL ========= */
    this.bike.setVelocityX(0);
    this.bike.setRotation(0);

    if (this.moveLeft || this.cursors.left.isDown) {
      this.bike.setVelocityX(-320);
      this.bike.setRotation(-0.12);
    }

    if (this.moveRight || this.cursors.right.isDown) {
      this.bike.setVelocityX(320);
      this.bike.setRotation(0.12);
    }

    /* ========= CLEANUP ========= */
    this.hurdles.children.iterate(h => {
      if (h && h.y > this.scale.height + 50) {
        h.destroy();
      }
    });
  }

  gameOver() {
    this.isGameOver = true;
    this.physics.pause();

    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "48px",
      color: "#ff0000"
    }).setOrigin(0.5);

    const restartBtn = this.add.rectangle(
      width / 2,
      height / 2 + 40,
      220,
      70,
      0x00aa00,
      0.9
    ).setInteractive();

    this.add.text(restartBtn.x, restartBtn.y, "RESTART", {
      fontSize: "26px",
      color: "#fff"
    }).setOrigin(0.5);

    restartBtn.on("pointerdown", () => {
      this.scene.restart();
    });
  }
}

/* ========= GAME CONFIG ========= */
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
