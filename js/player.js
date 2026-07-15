/**
 * プレイヤー（子猫）のクラス
 */
class Player {
  // 物理定数の定義（マジックナンバー排除）
  static CONFIG = {
    // ちびネコ時のサイズ
    CHIBI_WIDTH: 24,
    CHIBI_HEIGHT: 24,
    // スーパーネコ時のサイズ
    SUPER_WIDTH: 28,
    SUPER_HEIGHT: 38,
    
    // 物理パラメータ
    GRAVITY: 0.5,
    WALK_ACCEL: 0.2,
    RUN_ACCEL: 0.35,
    FRICTION: 0.85, // 地上での摩擦
    AIR_DRAG: 0.98,  // 空中での空気抵抗
    
    WALK_MAX_SPEED: 3.0,
    RUN_MAX_SPEED: 5.5,
    
    JUMP_FORCE: -9.0,     // 初速ジャンプ力
    JUMP_HOLD_ACCEL: -0.25, // 長押し時の上昇加速度
    JUMP_HOLD_MAX_FRAMES: 16, // 長押し可能フレーム数
    
    INVULNERABLE_DURATION: 120, // 被ダメージ後の無敵時間（フレーム）
    PIXEL_SCALE: 2 // ドットの描画スケール
  };

  // ドット絵データ (16x16 および 20x24 のアスキー文字表現)
  // . = 透明, 1 = 肌色, 2 = 白(シャツ/タオル), 3 = 黒(目/髪/靴), 4 = 青(エプロン/ズボン), 5 = 赤(ネクタイ/バケツ), 6 = 茶(モップ/掃除機), 7 = グレー(金属)
  static SPRITES = {
    CHIBI: { // 見習い清掃員
      IDLE: [
        "......3333......",
        ".....331133.....",
        ".....313113.....",
        ".....311113.....",
        "......2222......",
        ".....225522.....",
        "....22244222....",
        "...1124444211...",
        "...1144444411...",
        ".....444444.....",
        ".....444444.....",
        ".....44..44.....",
        ".....44..44.....",
        ".....44..44.....",
        "....333..333....",
        "....333..333...."
      ],
      WALK1:       [
        "......3333......",
        ".....331133.....",
        ".....313113.....",
        ".....311113.....",
        "......2222......",
        ".....225522.....",
        "....22244222....",
        "...1124444211...",
        "...1144444411...",
        ".....444444.....",
        ".....444444.....",
        ".....44..44.....",
        ".....44...44....",
        "....44.....44...",
        "....333....333..",
        "....333....333.."
      ],
      WALK2:       [
        "......3333......",
        ".....331133.....",
        ".....313113.....",
        ".....311113.....",
        "......2222......",
        ".....225522.....",
        "....22244222....",
        "...1124444211...",
        "...1144444411...",
        ".....444444.....",
        ".....444444.....",
        ".....44..44.....",
        "....44...44.....",
        "...44.....44....",
        "..333....333....",
        "..333....333...."
      ],
      JUMP:       [
        "......3333......",
        ".....331133.....",
        ".....313113.....",
        ".....311113.....",
        "....22222222....",
        "...1122552211...",
        "...1124444211...",
        ".....444444.....",
        ".....444444.....",
        ".....44..44.....",
        "....44....44....",
        "....44....44....",
        "...333....333...",
        "...333....333...",
        "................",
        "................"
      ],
      DIE: [
        "................",
        "......3333......",
        ".....331133.....",
        ".....313313.....",
        ".....311113.....",
        "......1111......",
        "....22222222....",
        "...1122552211...",
        "...1124444211...",
        ".....444444.....",
        "......4444......",
        ".....44..44.....",
        "....44....44....",
        "....33....33....",
        "...333....333...",
        "................"
      ]
    },
    SUPER: {
      IDLE:       [
        ".......3333.........",
        "......331133........",
        "......313113...22...",
        "......311113..2222..",
        ".......2222....22...",
        "......225522........",
        ".....22244222.......",
        "....1124444211......",
        "....1144444411.666..",
        "......444444...777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..666..",
        ".....44444444..666..",
        ".....44444444..666..",
        ".....444..444.......",
        ".....444..444.......",
        "....4444..4444......",
        "....3333..3333......",
        "....3333..3333......",
        "...33333..33333.....",
        "...33333..33333....."
      ],
      WALK1:       [
        ".......3333.........",
        "......331133........",
        "......313113...22...",
        "......311113..2222..",
        ".......2222....22...",
        "......225522........",
        ".....22244222.......",
        "....1124444211......",
        "....1144444411.666..",
        "......444444...777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..666..",
        "......444444...666..",
        ".......44.44...666..",
        "......444..444......",
        "......444..444......",
        ".....4444..4444.....",
        ".....3333..3333.....",
        ".....3333..3333.....",
        "....33333..33333....",
        "....33333..33333...."
      ],
      WALK2:       [
        ".......3333.........",
        "......331133........",
        "......313113...22...",
        "......311113..2222..",
        ".......2222....22...",
        "......225522........",
        ".....22244222.......",
        "....1124444211......",
        "....1144444411.666..",
        "......444444...777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        "......444444...666..",
        ".....4444444...666..",
        "....4444..444..666..",
        "...4444....444......",
        "...4444....444......",
        "...3333...4444......",
        "..33333...3333......",
        "..33333...3333......",
        "..33333..33333......",
        "..33333..33333......"
      ],
      JUMP:       [
        ".......3333.........",
        "......331133........",
        "......313113...22...",
        "......311113..2222..",
        ".....22222222..22...",
        "....1122552211......",
        "....1124444211......",
        "......444444...666..",
        ".....44444444..777..",
        ".....44444444..777..",
        ".....44444444..777..",
        "......444444...777..",
        ".....444..444..777..",
        "....4444..4444.666..",
        "....3333..3333.666..",
        "....3333..3333.666..",
        "...33333..33333.....",
        "...33333..33333.....",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "...................."
      ]
    },
    MOP: { // モップ清掃員
      IDLE:       [
        ".......8888.........",
        "......881188........",
        "......818118...22...",
        "......811118..2222..",
        ".......2222....22...",
        "......223322........",
        ".....22288222.......",
        "....1128888211......",
        "....1188888811......",
        "......888888........",
        ".....88888888...6...",
        ".....88888888..686..",
        ".....88888888.68886.",
        ".....88888888..686..",
        ".....88888888...6...",
        ".....88888888.......",
        ".....88888888.......",
        ".....888..888.......",
        ".....888..888.......",
        "....8888..8888......",
        "....3333..3333......",
        "....3333..3333......",
        "...33333..33333.....",
        "...33333..33333....."
      ],
      WALK1:       [
        ".......8888.........",
        "......881188........",
        "......818118...22...",
        "......811118..2222..",
        ".......2222....22...",
        "......223322........",
        ".....22288222.......",
        "....1128888211......",
        "....1188888811......",
        "......888888........",
        ".....88888888...6...",
        ".....88888888..686..",
        ".....88888888.68886.",
        ".....88888888..686..",
        ".....88888888...6...",
        "......888888........",
        ".......88.88........",
        "......888..888......",
        "......888..888......",
        ".....8888..8888.....",
        ".....3333..3333.....",
        ".....3333..3333.....",
        "....33333..33333....",
        "....33333..33333...."
      ],
      WALK2:       [
        ".......8888.........",
        "......881188........",
        "......818118...22...",
        "......811118..2222..",
        ".......2222....22...",
        "......223322........",
        ".....22288222.......",
        "....1128888211......",
        "....1188888811......",
        "......888888........",
        ".....88888888...6...",
        ".....88888888..686..",
        ".....88888888.68886.",
        ".....88888888..686..",
        "......888888....6...",
        ".....8888888........",
        "....8888..888.......",
        "...8888....888......",
        "...8888....888......",
        "...3333...8888......",
        "..33333...3333......",
        "..33333...3333......",
        "..33333..33333......",
        "..33333..33333......"
      ],
      JUMP:       [
        ".......8888.........",
        "......881188........",
        "......818118...22...",
        "......811118..2222..",
        ".....22222222..22...",
        "....1122332211......",
        "....1128888211......",
        "......888888........",
        ".....88888888.......",
        ".....88888888.......",
        ".....88888888...6...",
        "......888888...686..",
        ".....888..888.68886.",
        "....8888..8888.686..",
        "....3333..3333..6...",
        "....3333..3333......",
        "...33333..33333.....",
        "...33333..33333.....",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "...................."
      ]
    }
  };

  // パレットカラー定義
  static PALETTE = {
    '.': 'transparent',
    '1': '#ffcc99', // 肌色
    '2': '#ffffff', // 白（シャツ/タオル）
    '3': '#1a1a1a', // 黒（髪/靴）
    '4': '#204080', // 青（エプロン/ズボン）
    '5': '#cc2020', // 赤（ネクタイ）
    '6': '#804020', // 茶色（掃除機パーツ/モップの柄）
    '7': '#999999', // グレー（掃除機ボディ）
    '8': '#ff3333'  // 赤（ハンディモップ/赤い制服）
  };

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    
    // 状態管理
    this.powerState = 0; // 0: ちびネコ, 1: スーパーネコ
    this.width = Player.CONFIG.CHIBI_WIDTH;
    this.height = Player.CONFIG.CHIBI_HEIGHT;
    
    this.onGround = false;
    this.isDying = false;
    this.isClearing = false;
    this.direction = 1; // 1: 右, -1: 左
    
    // ジャンプ長押し制御
    this.jumpHoldTimer = 0;
    this.isJumping = false;
    
    // 被ダメ無敵タイマー
    this.invulnerableTimer = 0;
    this.knockbackTimer = 0; // 被弾時のノックバックタイマー
    
    // アニメーションタイマー
    this.animTimer = 0;
    this.animFrame = 0;
    
    this.shootCooldown = 0; // モップ投げのクールダウン
  }

  /**
   * CIAOちゅ〜るを獲得してパワーアップ
   */
  powerUp() {
    if (this.powerState === 0) {
      this.powerState = 1;
      this.width = Player.CONFIG.SUPER_WIDTH;
      this.height = Player.CONFIG.SUPER_HEIGHT;
      // パワーアップ時は少し上に持ち上げてめり込みを防ぐ
      this.y -= (Player.CONFIG.SUPER_HEIGHT - Player.CONFIG.CHIBI_HEIGHT);
      window.AudioManager.playPowerUp();
    }
  }

  /**
   * 赤いハンディモップを獲得してパワーアップ
   */
  powerUpToMop() {
    if (this.powerState < 2) {
      const prevPower = this.powerState;
      this.powerState = 2;
      this.width = Player.CONFIG.SUPER_WIDTH;
      this.height = Player.CONFIG.SUPER_HEIGHT;
      if (prevPower === 0) {
        this.y -= (Player.CONFIG.SUPER_HEIGHT - Player.CONFIG.CHIBI_HEIGHT);
      }
      window.AudioManager.playPowerUp();
    }
  }

  /**
   * ダメージを受ける
   */
  damage() {
    if (this.invulnerableTimer > 0 || this.isDying || this.isClearing) return;

    if (this.powerState >= 1) {
      // スーパー(1)またはモップ(2)状態なら、一気にちび状態に格下げ（初代マリオ仕様）
      this.powerState = 0;
      this.width = Player.CONFIG.CHIBI_WIDTH;
      this.height = Player.CONFIG.CHIBI_HEIGHT;
      this.invulnerableTimer = Player.CONFIG.INVULNERABLE_DURATION;
      
      // 被弾ノックバック（敵と反対方向に跳ね返る）
      this.knockbackTimer = 20;
      this.vx = -this.direction * 3.0; // 逆方向に押し出す
      this.vy = -4.0; // 上へ跳ねる
      this.onGround = false;

      window.AudioManager.playPowerDown();
    } else {
      // ちび状態なら死亡
      this.die("hit_enemy");
    }
  }

  /**
   * 死亡処理
   */
  die(reason = "unknown") {
    if (this.isDying) return;
    console.log(`Player died! Reason: ${reason}, Position: (${this.x}, ${this.y})`);
    this.isDying = true;
    this.vx = 0;
    this.vy = -7.5; // 上に跳ね上がる
    window.AudioManager.stopBGM();
    window.AudioManager.playDie();
  }

  /**
   * ステージクリア
   */
  clear() {
    if (this.isClearing) return;
    this.isClearing = true;
    this.vx = 1.8; // 自動的に右へ歩く
    this.vy = 0;
    window.AudioManager.stopBGM();
    window.AudioManager.playStageClear();
  }

  /**
   * プレイヤー状態の毎フレーム更新
   * @param {InputHandler} input - 入力オブジェクト
   * @param {TileMap} map - タイルマップオブジェクト
   */
  update(input, map) {
    // 1. 被ダメージ後の無敵時間・ノックバックの更新
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }
    if (this.knockbackTimer > 0) {
      this.knockbackTimer--;
    }

    // 2. 死亡時の処理
    if (this.isDying) {
      this.vy += Player.CONFIG.GRAVITY; // 重力のみ適用
      this.y += this.vy;
      // 画面外に落ちたらゲームループ側でリスタート処理されるため、ここでは何もしない
      return;
    }

    // 3. クリア時の処理
    if (this.isClearing) {
      this.vx = 1.5;
      this.vy += Player.CONFIG.GRAVITY;
      
      // マップとの衝突判定を行いつつ移動
      this.x += this.vx;
      map.checkCollisionsX(this);
      
      this.y += this.vy;
      this.onGround = false;
      map.checkCollisionsY(this);
      
      // アニメーション更新
      this.animTimer++;
      if (this.animTimer % 8 === 0) {
        this.animFrame = (this.animFrame + 1) % 2;
      }
      return;
    }

    // 4. 通常の移動入力・物理処理
    const accel = input.dash ? Player.CONFIG.RUN_ACCEL : Player.CONFIG.WALK_ACCEL;
    const maxSpeed = input.dash ? Player.CONFIG.RUN_MAX_SPEED : Player.CONFIG.WALK_MAX_SPEED;

    // 左右移動
    if (this.knockbackTimer > 0) {
      // ノックバック中はプレイヤー入力は受け付けず、慣性で動く
      if (this.onGround) {
        this.vx *= Player.CONFIG.FRICTION;
      } else {
        this.vx *= Player.CONFIG.AIR_DRAG;
      }
    } else if (input.moveLeft) {
      // 逆方向に入力した場合はブレーキ力（減速度）を2倍にする
      if (this.vx > 0) {
        this.vx -= accel * 2.0;
      } else {
        this.vx -= accel;
      }
      this.direction = -1;
    } else if (input.moveRight) {
      // 逆方向に入力した場合はブレーキ力（減速度）を2倍にする
      if (this.vx < 0) {
        this.vx += accel * 2.0;
      } else {
        this.vx += accel;
      }
      this.direction = 1;
    } else {
      // 摩擦の適用
      if (this.onGround) {
        this.vx *= Player.CONFIG.FRICTION;
      } else {
        this.vx *= Player.CONFIG.AIR_DRAG;
      }
      // 微小な速度はカット
      if (Math.abs(this.vx) < 0.05) this.vx = 0;
    }

    // 速度制限
    if (this.vx > maxSpeed) this.vx = maxSpeed;
    if (this.vx < -maxSpeed) this.vx = -maxSpeed;

    // 重力
    this.vy += Player.CONFIG.GRAVITY;

    // ジャンプ処理 (ノックバック中はジャンプ不可)
    if (this.knockbackTimer <= 0 && input.jumpPressed && this.onGround) {
      this.vy = Player.CONFIG.JUMP_FORCE;
      this.onGround = false;
      this.isJumping = true;
      this.jumpHoldTimer = 0;
      window.AudioManager.playJump();
    } else if (this.knockbackTimer <= 0 && input.jump && this.isJumping) {
      // ジャンプボタン押しっぱなしによる上昇高度アップ
      if (this.jumpHoldTimer < Player.CONFIG.JUMP_HOLD_MAX_FRAMES) {
        this.vy += Player.CONFIG.JUMP_HOLD_ACCEL;
        this.jumpHoldTimer++;
      } else {
        this.isJumping = false;
      }
    } else {
      this.isJumping = false;
    }

    // 5. 仮移動とマップ衝突判定
    this.x += this.vx;
    // X方向の衝突判定
    map.checkCollisionsX(this);

    this.y += this.vy;
    // Y方向の衝突判定
    this.onGround = false;
    map.checkCollisionsY(this);

    // 画面外落下チェック
    if (this.y > map.height * map.tileSize + 100) {
      this.die("fall_out_of_bounds");
    }

    // 6. アニメーション制御用のタイマー更新
    this.animTimer++;
    if (this.onGround) {
      if (Math.abs(this.vx) > 0.1) {
        // 移動速度に応じてアニメーション速度を変える
        const animSpeed = input.dash ? 5 : 8;
        if (this.animTimer % animSpeed === 0) {
          this.animFrame = (this.animFrame + 1) % 2;
        }
      } else {
        this.animFrame = 0;
      }
    }

    if (this.shootCooldown > 0) {
      this.shootCooldown--;
    }
  }

  /**
   * ハンディモップを投げる
   */
  throwMop(game) {
    if (this.shootCooldown > 0) return;
    if (game.thrownMops.length >= 2) return;

    const mopX = this.x + (this.direction === 1 ? this.width : -16);
    const mopY = this.y + this.height / 3;
    game.thrownMops.push(new window.ThrownMop(mopX, mopY, this.direction));
    this.shootCooldown = 15; // 15フレームのクールダウン

    // 投げる効果音
    window.AudioManager.playSound('triangle', 523, 880, 0.1, 0.15);
  }

  /**
   * プレイヤーキャラクターを Canvas 上に描画する
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cameraX - カメラのX座標 (スクロール追従用)
   */
  draw(ctx, cameraX) {
    // 無敵時間中は点滅表示 (4フレーム周期)
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 4) % 2 === 0) {
      return;
    }

    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y);

    let spriteArray = [];
    
    if (this.isDying) {
      spriteArray = Player.SPRITES.CHIBI.DIE;
    } else if (!this.onGround) {
      if (this.powerState === 2) {
        spriteArray = Player.SPRITES.MOP.JUMP;
      } else {
        spriteArray = this.powerState === 1 ? Player.SPRITES.SUPER.JUMP : Player.SPRITES.CHIBI.JUMP;
      }
    } else if (Math.abs(this.vx) > 0.1) {
      const walkSprites = this.powerState === 2 ? 
        [Player.SPRITES.MOP.WALK1, Player.SPRITES.MOP.WALK2] : 
        (this.powerState === 1 ? 
          [Player.SPRITES.SUPER.WALK1, Player.SPRITES.SUPER.WALK2] : 
          [Player.SPRITES.CHIBI.WALK1, Player.SPRITES.CHIBI.WALK2]);
      spriteArray = walkSprites[this.animFrame];
    } else {
      spriteArray = this.powerState === 2 ? Player.SPRITES.MOP.IDLE : (this.powerState === 1 ? Player.SPRITES.SUPER.IDLE : Player.SPRITES.CHIBI.IDLE);
    }

    this.drawPixelSprite(ctx, drawX, drawY, spriteArray, this.direction === -1);
  }

  /**
   * 文字列配列で定義されたドット絵スプライトを描画する
   */
  drawPixelSprite(ctx, startX, startY, spriteArray, flipX) {
    const scale = Player.CONFIG.PIXEL_SCALE;
    const rows = spriteArray.length;
    const cols = spriteArray[0].length;

    // スプライト全体の幅と高さ
    const spriteWidth = cols * scale;
    const spriteHeight = rows * scale;

    // 描画位置の基準点調整 (Playerオブジェクトの足元と、スプライトの足元を揃える)
    const offsetX = (this.width - spriteWidth) / 2;
    const offsetY = this.height - spriteHeight;

    ctx.save();
    
    if (flipX) {
      // 左右反転描画
      ctx.translate(startX + offsetX + spriteWidth / 2, startY + offsetY + spriteHeight / 2);
      ctx.scale(-1, 1);
      ctx.translate(-(startX + offsetX + spriteWidth / 2), -(startY + offsetY + spriteHeight / 2));
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const char = spriteArray[r][c];
        const color = Player.PALETTE[char];
        
        if (color && color !== 'transparent') {
          ctx.fillStyle = color;
          // 1ドットを scale x scale のサイズで描画
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

// グローバルに公開
window.Player = Player;
