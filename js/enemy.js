/**
 * 敵キャラクターのベースクラス
 */
class Enemy {
  static PIXEL_SCALE = 2;

  constructor(x, y, type = 'mouse') {
    this.x = x;
    this.y = y;
    this.vx = -1.0; // 最初は左へ歩く
    this.vy = 0;
    this.width = 24;
    this.height = 20;
    this.type = type;

    this.onGround = false;
    this.isDead = false;
    this.deadTimer = 0;
    this.direction = -1; // -1: 左, 1: 右

    this.animTimer = 0;
    this.animFrame = 0;
  }

  /**
   * 敵を倒す（踏む）
   */
  stomp() {
    if (this.isDead) return;
    this.isDead = true;
    this.vx = (Math.random() * 2 - 1) * 1.5; // 左右に少し吹き飛ぶ
    this.vy = -4.5; // 上に跳ね上がる
    this.deadTimer = 60; // 60フレームかけて画面外に落下
    this.rotation = 0;
    window.AudioManager.playStomp();
  }

  /**
   * 毎フレームの更新
   */
  update(map) {
    if (this.isDead) {
      if (this.deadTimer > 0) {
        this.deadTimer--;
        
        // 撃破後の物理：重力落下 ＋ 回転
        this.vy += 0.3;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.2; // くるくる回転
      }
      return;
    }

    // 重力の適用
    this.vy += 0.5; // 重力

    // 移動速度の設定
    this.vx = this.direction * 1.0;

    // 仮移動と衝突判定 (X方向)
    this.x += this.vx;
    this.checkWallCollisionX(map);

    // 仮移動と衝突判定 (Y方向)
    this.y += this.vy;
    this.onGround = false;
    this.checkTerrainCollisionY(map);

    // 崖（エッジ）の検出: 地上にいて、進行方向に地面が無い場合は反転する
    if (this.onGround) {
      this.checkEdges(map);
    }

    // アニメーションの更新
    this.animTimer++;
    if (this.animTimer % 10 === 0) {
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  /**
   * X方向の壁との衝突判定（衝突時に反転）
   */
  checkWallCollisionX(map) {
    const overlap = map.getTileOverlapX(this);
    if (overlap !== 0) {
      this.x -= overlap;
      this.direction *= -1; // 反転
      this.vx *= -1;
    }
  }

  /**
   * Y方向の地面との衝突判定
   */
  checkTerrainCollisionY(map) {
    const overlap = map.getTileOverlapY(this);
    if (overlap !== 0) {
      if (this.vy > 0) {
        this.onGround = true;
        this.vy = 0;
      } else if (this.vy < 0) {
        this.vy = 0;
      }
      this.y -= overlap;
    }
  }

  /**
   * 崖（進行方向の床の切れ目）を検知して反転する
   */
  checkEdges(map) {
    // 進行方向の少し先の下側の座標
    const checkOffset = this.direction === 1 ? this.width + 4 : -4;
    const checkX = this.x + checkOffset;
    const checkY = this.y + this.height + 4; // 地面があるべき高さ

    const tileX = Math.floor(checkX / map.tileSize);
    const tileY = Math.floor(checkY / map.tileSize);

    // 進行先の下側が空（衝突しないタイル）なら反転
    if (!map.isSolidTileAt(tileX, tileY)) {
      this.direction *= -1;
      this.vx *= -1;
    }
  }

  /**
   * 描画
   */
  draw(ctx, cameraX) {
    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y);

    // 画面外（かつカメラの少し左右外）なら描画をスキップ
    if (drawX < -50 || drawX > ctx.canvas.width + 50) return;

    let spriteArray = [];
    if (this.isDead) {
      spriteArray = Enemy.SPRITES.MOUSE.FLAT;
    } else {
      spriteArray = this.animFrame === 0 ? Enemy.SPRITES.MOUSE.WALK1 : Enemy.SPRITES.MOUSE.WALK2;
    }

    ctx.save();
    
    // 死んでいる時は、その中心を原点にして回転し、逆さまにして描画
    if (this.isDead) {
      const scale = Enemy.PIXEL_SCALE;
      const sh = spriteArray.length * scale;
      const sw = spriteArray[0].length * scale;
      const cx = drawX + sw / 2;
      const cy = drawY + sh / 2;
      
      ctx.translate(cx, cy);
      ctx.rotate(this.rotation || 0);
      ctx.scale(1, -1); // 逆さまにする
      ctx.translate(-cx, -cy);
    }

    this.drawPixelSprite(ctx, drawX, drawY, spriteArray, this.direction === 1);
    
    ctx.restore();
  }

  drawPixelSprite(ctx, startX, startY, spriteArray, flipX) {
    const scale = Enemy.PIXEL_SCALE;
    const rows = spriteArray.length;
    const cols = spriteArray[0].length;

    const spriteWidth = cols * scale;
    const spriteHeight = rows * scale;

    const offsetX = (this.width - spriteWidth) / 2;
    const offsetY = this.height - spriteHeight;

    ctx.save();
    
    if (flipX) {
      ctx.translate(startX + offsetX + spriteWidth / 2, startY + offsetY + spriteHeight / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(startX + offsetX + spriteWidth / 2), -(startY + offsetY + spriteHeight / 2));
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const char = spriteArray[r][c];
        const color = Enemy.PALETTE[char];
        
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(
            startX + offsetX + c * scale, 
            startY + offsetY + r * scale, 
            scale, 
            scale
          );
        }
      }
    }
    
    ctx.restore();
  }
}

// ドット絵データとパレットの定義
// . = 透明, 1 = 肌色, 2 = 服の色(グレー), 3 = ズボン(黒), 4 = 靴(茶色), 5 = スマホ(白)
Enemy.PALETTE = {
  '.': 'transparent',
  '1': '#ffcc99', // 肌色
  '2': '#888888', // 服
  '3': '#222222', // ズボン
  '4': '#663300', // 靴
  '5': '#ffffff'  // スマホ
};

Enemy.SPRITES = {
  MOUSE: { // 迷惑な客A (歩きスマホ)
    WALK1: [
      ".......333......",
      "......31113.....",
      "......31313.....",
      ".......111......",
      "......22222.....",
      ".....2222222....",
      ".....12222215...",
      ".....122222.5...",
      "......22222.....",
      "......33.33.....",
      "......33.33.....",
      "......33..33....",
      "......33..33....",
      "......44..44....",
      ".....444..444..."
    ],
    WALK2: [
      ".......333......",
      "......31113.....",
      "......31313.....",
      ".......111......",
      "......22222.....",
      ".....2222222....",
      ".....12222215...",
      ".....122222.5...",
      "......22222.....",
      "......33.33.....",
      "......33.33.....",
      ".......333......",
      ".......333......",
      ".......444......",
      "......44444....."
    ],
    FLAT: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "......33........",
      ".....3113.......",
      "....2222222.....",
      "...433333334....",
      "....12222215...."
    ]
  }
};

// グローバルに公開
window.Enemy = Enemy;
