/**
 * 簡易パーティクルクラス (エフェクト用)
 */
class Particle {
  constructor(x, y, color, shape = 'circle') {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() * 2 - 1) * 3;
    this.vy = (Math.random() * 2 - 1) * 4 - 2; // 上方向に散る
    this.color = color;
    this.shape = shape;
    this.size = Math.random() * 4 + 2; // サイズ
    this.alpha = 1.0;
    this.decay = Math.random() * 0.03 + 0.02; // 消滅速度
    this.gravity = 0.12;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }

  draw(ctx, cameraX) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    
    const drawX = this.x - cameraX;
    const drawY = this.y;

    if (this.shape === 'star') {
      // 簡易的な十字星を描画
      ctx.beginPath();
      ctx.moveTo(drawX, drawY - this.size);
      ctx.lineTo(drawX + this.size/3, drawY - this.size/3);
      ctx.lineTo(drawX + this.size, drawY);
      ctx.lineTo(drawX + this.size/3, drawY + this.size/3);
      ctx.lineTo(drawX, drawY + this.size);
      ctx.lineTo(drawX - this.size/3, drawY + this.size/3);
      ctx.lineTo(drawX - this.size, drawY);
      ctx.lineTo(drawX - this.size/3, drawY - this.size/3);
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'rect') {
      // 矩形（ブロック破片など）
      ctx.fillRect(drawX - this.size, drawY - this.size, this.size * 2, this.size * 2);
    } else {
      // 円形
      ctx.beginPath();
      ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * 投げられたハンディモップのクラス
 */
class ThrownMop {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.width = 16;
    this.height = 16;
    this.vx = direction * 5.0; // 弾速
    this.vy = 1.0; // 初速下向き
    this.onGround = false;
    this.shouldRemove = false;
    this.angle = 0;
  }

  update(map) {
    // 重力
    this.vy += 0.35;
    
    // X移動
    this.x += this.vx;
    
    // 壁との衝突
    const overlapX = map.getTileOverlapX(this);
    if (overlapX !== 0) {
      this.x -= overlapX;
      // 壁にぶつかったら消滅
      this.shouldRemove = true;
    }

    // Y移動
    this.y += this.vy;
    this.onGround = false;
    
    // Y方向の床・天井との衝突
    const overlapY = map.getTileOverlapY(this);
    if (overlapY !== 0) {
      if (this.vy > 0) {
        // 床に着地したら跳ねる
        this.y -= overlapY;
        this.vy = -4.5;
        this.onGround = true;
      } else {
        // 天井にぶつかったら消滅
        this.y -= overlapY;
        this.shouldRemove = true;
      }
    }

    // 画面外に落ちたら消滅
    if (this.y > map.height * map.tileSize + 50) {
      this.shouldRemove = true;
    }

    // 回転アニメーション
    this.angle += this.vx > 0 ? 0.25 : -0.25;
  }

  draw(ctx, cameraX) {
    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y);

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);
    ctx.rotate(this.angle);

    // 柄（茶色の棒）
    ctx.strokeStyle = '#804020';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, 6);
    ctx.stroke();

    // 赤いフワフワ部分
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // フワフワのディテール（ピンク・白ドット）
    ctx.fillStyle = '#ff9999';
    ctx.fillRect(-3, -3, 2, 2);
    ctx.fillRect(1, -2, 2, 2);
    ctx.fillRect(-2, 2, 2, 2);

    ctx.restore();
  }
}

/**
 * ゲーム全体の制御とループを管理するクラス
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // UI 要素の取得
    this.soundBtn = document.getElementById('btn-sound');
    this.soundIndicator = document.getElementById('sound-indicator');
    this.pauseBtn = document.getElementById('btn-pause');
    this.resetBtn = document.getElementById('btn-restart');
    this.overlay = document.getElementById('screen-overlay');
    this.overlayTitle = document.getElementById('overlay-title');
    this.overlayMsg = document.getElementById('overlay-msg');
    this.overlayResumeBtn = document.getElementById('btn-resume-overlay');
    
    // 新しいタイトル画面のDOM
    this.titleScreen = document.getElementById('title-screen');
    this.btnStartGame = document.getElementById('btn-start-game');

    // ゲーム状態
    // 'TITLE', 'START', 'PLAY', 'PAUSE', 'STAGE_CLEAR', 'GAME_OVER', 'ALL_CLEAR'
    this.state = 'TITLE';
    
    // グローバルなゲームスコア
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.timer = 400;
    this.timerTick = 0;
    
    this.currentStage = '1-1';
    
    // スクロール追従カメラ
    this.cameraX = 0;
    
    // エンティティ
    this.player = null;
    this.map = null;
    this.enemies = [];
    this.particles = [];
    this.thrownMops = [];
    
    // クリア演出用の状態
    this.clearState = 0;
    this.clearTimer = 0;

    // イベントのセットアップ
    this.setupUIEvents();
    
    // ゲームループ開始
    this.lastTime = 0;
    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * パーティクルを生成するヘルパーメソッド
   */
  spawnParticles(x, y, color, count = 8, shape = 'circle') {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color, shape));
    }
  }

  /**
   * UIのボタンイベントのセットアップ
   */
  setupUIEvents() {
    // 音声ON/OFF
    this.soundBtn.addEventListener('click', () => {
      const isMuted = window.AudioManager.toggleMute();
      this.soundIndicator.textContent = isMuted ? 'OFF' : 'ON';
      // ボタンのアクティブ状態
      if (isMuted) {
        this.soundBtn.classList.add('muted-btn');
      } else {
        this.soundBtn.classList.remove('muted-btn');
      }
    });

    // 一時停止
    this.pauseBtn.addEventListener('click', () => {
      this.togglePause();
    });

    this.overlayResumeBtn.addEventListener('click', () => {
      if (this.state === 'PAUSE') {
        this.togglePause();
      }
    });
    
    // タイトル画面のSTARTボタン
    if (this.btnStartGame) {
      this.btnStartGame.addEventListener('click', () => {
        if (this.state === 'TITLE') {
          this.titleScreen.classList.add('hidden');
          this.state = 'PLAY';
          this.initStage('1-1'); // 1-1からスタート
        }
      });
    }

    // リセット
    this.resetBtn.addEventListener('click', () => {
      this.resetGame();
    });
  }

  /**
   * ゲームの初期化 (ステージ開始時)
   */
  initStage(stageName) {
    // 以前のプレイヤーステータス（スーパー状態か）と、直前に死んでいたかどうかを保持
    const previousPowerState = this.player ? this.player.powerState : 0;
    const wasDying = this.player ? this.player.isDying : false;

    this.currentStage = stageName;
    this.map = new window.TileMap(stageName);
    
    // プレイヤーの配置 (1-1、1-2で初期位置調整)
    const playerStartX = 64;
    const playerStartY = stageName === '1-1' ? 300 : 250;
    this.player = new window.Player(playerStartX, playerStartY);

    // 状態の引き継ぎ（直前に死んでおらず、スーパーネコだった場合のみ引き継ぐ）
    if (!wasDying && previousPowerState === 1) {
      this.player.powerState = 1;
      this.player.width = window.Player.CONFIG.SUPER_WIDTH;
      this.player.height = window.Player.CONFIG.SUPER_HEIGHT;
      // 足元を揃えるためにY座標を少し持ち上げる
      this.player.y -= (window.Player.CONFIG.SUPER_HEIGHT - window.Player.CONFIG.CHIBI_HEIGHT);
    }
    
    this.cameraX = 0;
    this.timer = 400;
    this.timerTick = 0;
    
    // パーティクルとクリア状態、モップのリセット
    this.particles = [];
    this.thrownMops = [];
    this.clearState = 0;
    this.clearTimer = 0;

    // 敵の配置
    this.enemies = [];
    const tileSize = this.map.tileSize;
    
    if (stageName === '1-1') {
      // 1-1 敵の座標定義 (階段や土管に埋まらないように調整)
      const enemyXCoords = [480, 800, 1120, 1600, 2080, 2400, 3040, 3680, 4480, 4640, 5400, 5800, 6000];
      enemyXCoords.forEach(x => {
        // 地面の少し上に配置 (Y = 11タイル * 32 = 352px - 20px)
        this.enemies.push(new window.Enemy(x, 100, 'mouse'));
      });
    } else if (stageName === '1-2') {
      // 1-2 敵の座標定義
      const enemyXCoords = [400, 700, 1050, 1400, 1750, 2100, 2500, 2900, 3300, 3700, 4100, 4500, 5000, 5500, 6000, 6500];
      enemyXCoords.forEach(x => {
        // Y=11タイルの地面
        this.enemies.push(new window.Enemy(x, 100, 'mouse'));
      });
    }

    // BGMの再生
    window.AudioManager.playBGM(stageName);
  }

  /**
   * ポーズ切り替え
   */
  togglePause() {
    if (this.state === 'PLAY') {
      this.state = 'PAUSE';
      this.showOverlay('PAUSED', 'Press ESC or Click resume to play');
    } else if (this.state === 'PAUSE') {
      this.state = 'PLAY';
      this.hideOverlay();
      // オーディオリジューム対応
      if (window.AudioManager.ctx && window.AudioManager.ctx.state === 'suspended') {
        window.AudioManager.ctx.resume();
      }
    }
  }

  /**
   * ゲームの完全リセット
   */
  resetGame() {
    this.score = 0;
    this.coins = 0;
    this.lives = 3;
    this.hideOverlay();
    this.initStage('1-1');
    this.state = 'PLAY';
  }

  /**
   * オーバーレイ表示
   */
  showOverlay(title, msg, showButton = true) {
    this.overlayTitle.textContent = title;
    this.overlayMsg.textContent = msg;
    if (showButton) {
      this.overlayResumeBtn.classList.remove('hidden');
    } else {
      this.overlayResumeBtn.classList.add('hidden');
    }
    this.overlay.classList.remove('hidden');
  }

  /**
   * オーバーレイ非表示
   */
  hideOverlay() {
    this.overlay.classList.add('hidden');
  }

  /**
   * ゲームループ
   */
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // タブがバックグラウンドに回った際の巨大なdtを防ぐ
    if (dt > 100) dt = 100;

    this.accumulator += dt;

    // 固定タイムステップ(16.6ms)ごとにupdateを呼び出す
    while (this.accumulator >= this.STEP) {
      this.update();
      this.accumulator -= this.STEP;
    }

    this.draw();
    
    // キー入力更新 (previousKeysの書き換え用)
    window.Input.update();

    requestAnimationFrame((t) => this.loop(t));
  }

  /**
   * 状態の更新
   */
  update() {
    // ポーズ入力の監視
    if (window.Input.pausePressed) {
      this.togglePause();
    }

    if (this.state === 'START') {
      // ENTER または Space または Z でゲーム開始
      if (window.Input.isPressed('Enter') || window.Input.isPressed('Space') || window.Input.isPressed('KeyZ')) {
        // オーディオの初期アクティベート
        window.AudioManager.init();
        this.resetGame();
      }
      return;
    }

    if (this.state === 'PLAY') {
      // 1. プレイヤーの更新
      this.player.update(window.Input, this.map);

      // 2. マップアイテムとブロックの更新
      this.map.updateItemsAndBlocks();

      // 3. 敵キャラクターの更新
      this.enemies.forEach((enemy, idx) => {
        enemy.update(this.map);
        
        // プレイヤーと敵の衝突判定
        if (!enemy.isDead && !this.player.isDying && !this.player.isClearing) {
          if (this.checkAABBCollision(this.player, enemy)) {
            // 踏みつけ判定: プレイヤーが落下中であり、かつ足元が敵の頭部中央より上にある場合
            const playerFeetY = this.player.y + this.player.height;
            const enemyHeadY = enemy.y;
            
            if (this.player.vy > 0 && (playerFeetY - this.player.vy <= enemyHeadY + 8 || playerFeetY <= enemyHeadY + 20)) {
              enemy.stomp();
              this.player.vy = -5.0; // 小バウンド
              this.score += 100;
              // 敵撃破パーティクル
              this.spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff80a0', 10, 'circle');
            } else {
              // 通常の被ダメージ
              console.log(`Player hit by enemy! Player: (${this.player.x.toFixed(1)}, ${this.player.y.toFixed(1)}), Enemy: (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}, type=${enemy.type})`);
              this.player.damage();
            }
          }
        }
      });

      // 死んだ敵の消去
      this.enemies = this.enemies.filter(enemy => !enemy.isDead || enemy.deadTimer > 0);

      // 4. プレイヤーと落ちているアイテムの衝突判定
      this.map.items.forEach(item => {
        if (!item.shouldRemove && this.checkAABBCollision(this.player, item)) {
          if (item.type === 'coin') {
            this.coins++;
            this.score += 200;
            item.shouldRemove = true;
            window.AudioManager.playCoin();
            // コイン獲得パーティクル
            this.spawnParticles(item.x + item.width / 2, item.y + item.height / 2, '#ffe600', 8, 'star');
            
            if (this.coins >= 100) {
              this.lives++;
              this.coins = 0;
              window.AudioManager.playSound('sawtooth', 400, 800, 0.5, 0.5); // 1UP SE代用
            }
          } else if (item.type === 'churu') {
            this.player.powerUp();
            this.score += 1000;
            item.shouldRemove = true;
            // ちゅ〜る獲得パーティクル (ハートフルなピンク/金)
            this.spawnParticles(item.x + item.width / 2, item.y + item.height / 2, '#ff007f', 15, 'star');
          } else if (item.type === 'mop') {
            this.player.powerUpToMop();
            this.score += 1000;
            item.shouldRemove = true;
            // モップ獲得パーティクル (真っ赤なスター)
            this.spawnParticles(item.x + item.width / 2, item.y + item.height / 2, '#ff3333', 15, 'star');
          }
        }
      });

      // 4.1. 投げられたモップの更新と衝突判定
      for (let i = this.thrownMops.length - 1; i >= 0; i--) {
        const mop = this.thrownMops[i];
        mop.update(this.map);
        
        // 敵との衝突判定
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (!enemy.isDead && this.checkAABBCollision(mop, enemy)) {
            enemy.stomp(); // 敵を倒す（踏みつけと同じエフェクトを流用）
            this.score += 200;
            mop.shouldRemove = true;
            this.spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ffcc00', 8, 'circle');
            break;
          }
        }
        
        if (mop.shouldRemove) {
          // 消滅時に綿埃風エフェクト
          this.spawnParticles(mop.x + mop.width / 2, mop.y + mop.height / 2, '#ff6666', 6, 'circle');
          this.thrownMops.splice(i, 1);
        }
      }

      // 4.2. モップ投げ入力の監視
      if (this.player.powerState === 2) {
        if (window.Input.isPressed('ShiftLeft') || window.Input.isPressed('ShiftRight') || window.Input.isPressed('KeyX')) {
          this.player.throwMop(this);
        }
      }

      // 4.5. パーティクルの更新
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // 5. ゴールゲート判定
      // マップ上のゴールポール(12)またはゲート(11)のタイルにプレイヤーが重なったか
      const pCenterX = this.player.x + this.player.width / 2;
      const pCenterY = this.player.y + this.player.height / 2;
      const tx = Math.floor(pCenterX / this.map.tileSize);
      const ty = Math.floor(pCenterY / this.map.tileSize);
      const currentTile = this.map.getTileAt(tx, ty);
      
      if (currentTile === this.map.TILES.GOAL_BAR || currentTile === this.map.TILES.GOAL_POLE) {
        this.state = 'STAGE_CLEAR';
        this.player.clear();
      }

      // 6. タイマー更新
      this.timerTick++;
      if (this.timerTick >= 60) { // 60フレームで1秒減少
        this.timerTick = 0;
        this.timer--;
        if (this.timer <= 0) {
          this.player.die("time_up");
        }
      }

      // 7. カメラ位置の更新 (プレイヤー追従、滑らかなスクロール)
      const targetCamX = this.player.x - this.canvas.width / 2 + this.player.width / 2;
      this.cameraX = targetCamX;
      // カメラの境界制限
      if (this.cameraX < 0) this.cameraX = 0;
      const maxCamX = this.map.width * this.map.tileSize - this.canvas.width;
      if (this.cameraX > maxCamX) this.cameraX = maxCamX;

      // 8. プレイヤー死亡時の処理
      if (this.player.isDying && this.player.y > this.map.height * this.map.tileSize + 80) {
        this.lives--;
        if (this.lives <= 0) {
          this.state = 'GAME_OVER';
          this.showOverlay('GAME OVER', 'Press Start to Reset', false);
        } else {
          // 残機があればステージやり直し
          this.initStage(this.currentStage);
        }
      }
    }

    if (this.state === 'STAGE_CLEAR') {
      // プレイヤーの自動歩行とクリア演出アニメーション
      this.player.update(null, this.map);
      this.map.updateItemsAndBlocks();

      // パーティクルの更新
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.update();
        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      this.clearTimer++;

      if (this.clearState === 0) {
        // プレイヤーが右へ一定時間進み、落ち着いたらカウントダウン集計開始
        if (this.clearTimer > 110) {
          this.clearState = 1;
          this.clearTimer = 0;
        }
      } else if (this.clearState === 1) {
        // 残りタイムを集計
        if (this.timer > 0) {
          // 1フレームあたり最大4秒ずつ集計してスピーディーにする
          const dec = Math.min(this.timer, 4);
          this.timer -= dec;
          this.score += dec * 10;
          
          // 集計ピピピピ音
          if (this.clearTimer % 3 === 0) {
            window.AudioManager.playTick();
          }

          // プレイヤーの周囲に金色のキラキラパーティクルを発生させる
          this.spawnParticles(
            this.player.x + this.player.width / 2 + (Math.random() * 40 - 20),
            this.player.y + (Math.random() * 20 - 10),
            '#ffea00',
            1,
            'star'
          );
        } else {
          // カウントダウン終了
          this.clearState = 2;
          this.clearTimer = 0;
        }
      } else if (this.clearState === 2) {
        // 集計完了後、しばらく余韻を残してから次のステージへ遷移
        if (this.clearTimer > 80) {
          if (this.currentStage === '1-1') {
            this.initStage('1-2');
            this.state = 'PLAY';
          } else {
            this.state = 'ALL_CLEAR';
            this.showOverlay('CONGRATULATIONS!', 'You cleared all levels! Press Start to replay.', false);
          }
        }
      }
      return;
    }

    if (this.state === 'GAME_OVER' || this.state === 'ALL_CLEAR') {
      if (window.Input.isPressed('Enter') || window.Input.isPressed('Space') || window.Input.isPressed('KeyZ')) {
        this.resetGame();
      }
    }
  }

  /**
   * 矩形の衝突判定 (AABB)
   */
  checkAABBCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  /**
   * 画面描画
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. パララックス背景の描画
    if (this.map) {
      this.map.drawBackground(this.ctx, this.cameraX);
    }

    if (this.state === 'START') {
      this.drawStartScreen();
      return;
    }

    // 2. マップタイルの描画
    if (this.map) {
      this.map.draw(this.ctx, this.cameraX);
    }

    // 3. 敵キャラクターの描画
    this.enemies.forEach(enemy => enemy.draw(this.ctx, this.cameraX));

    // 4. プレイヤーの描画
    if (this.player) {
      this.player.draw(this.ctx, this.cameraX);
    }

    // 4.1. 投げられたモップの描画
    this.thrownMops.forEach(mop => mop.draw(this.ctx, this.cameraX));

    // 4.5. パーティクルの描画
    this.particles.forEach(p => p.draw(this.ctx, this.cameraX));

    // 5. HUD (ゲーム情報UI) の描画
    this.drawHUD();

    // 6. ステージクリア演出テキスト
    if (this.state === 'STAGE_CLEAR') {
      this.drawSTAGE_CLEAR_Screen();
    }
  }

  /**
   * ステージクリア時のビジュアルテキストとボーナス集計の描画
   */
  drawSTAGE_CLEAR_Screen() {
    this.ctx.save();
    
    // ネオンシャドウつきの「STAGE CLEAR!」
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ff007f';
    this.ctx.font = '24px "Press Start 2P", monospace';
    this.ctx.shadowColor = '#ff007f';
    
    // 集計中または集計完了時はチカチカ点滅させる
    const blink = Math.floor(this.clearTimer / 8) % 2 === 0;
    if (this.clearState >= 1 && blink) {
      this.ctx.shadowBlur = 10;
      this.ctx.fillText('STAGE CLEAR!', this.canvas.width / 2, 160);
    } else if (this.clearState >= 1) {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText('STAGE CLEAR!', this.canvas.width / 2, 160);
    } else {
      // 歩いている間は常時ピンク表示
      this.ctx.shadowBlur = 8;
      this.ctx.fillText('STAGE CLEAR!', this.canvas.width / 2, 160);
    }

    // 集計ボーナステキスト
    if (this.clearState === 1) {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#00d2ff';
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillText('ADDING TIME BONUS...', this.canvas.width / 2, 210);
    } else if (this.clearState === 2) {
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#ffe600';
      this.ctx.font = '12px "Press Start 2P", monospace';
      this.ctx.fillText('TIME BONUS COMPLETE!', this.canvas.width / 2, 210);
    }
    
    this.ctx.restore();
  }

  /**
   * HUDの描画 (マリオ風)
   */
  drawHUD() {
    this.ctx.save();
    
    // フォント設定 (Press Start 2P)
    this.ctx.font = '10px "Press Start 2P", monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';

    // 1行目テキスト
    this.ctx.fillText('STAFF', 24, 16);
    this.ctx.fillText('COIN', 160, 16);
    this.ctx.fillText('FLOOR', 300, 16);
    this.ctx.fillText('TIME', 410, 16);

    // 2行目値
    // スコア (6桁ゼロパディング)
    const scoreStr = String(this.score).padStart(6, '0');
    this.ctx.fillText(scoreStr, 24, 28);
    
    // コイン数 (金色のコインアイコン ＋ x数)
    this.ctx.fillStyle = '#ffe600';
    this.ctx.fillRect(160, 28, 6, 8); // コイン簡易ドット
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`x${String(this.coins).padStart(2, '0')}`, 174, 28);

    // ワールド名
    this.ctx.fillText(this.currentStage, 310, 28);

    // タイマー
    const timerStr = String(Math.max(0, this.timer)).padStart(3, '0');
    this.ctx.fillText(timerStr, 418, 28);

    // 残機表示 (顔アイコンと × X)
    const faceSprite = [
        "......3333......",
        ".....331133.....",
        ".....313113.....",
        ".....311113.....",
        "......2222......",
        ".....225522....."
    ];
    const iconScale = 2;
    const iconX = 24;
    const iconY = this.canvas.height - 30;
    
    for (let r = 0; r < faceSprite.length; r++) {
      for (let c = 0; c < faceSprite[0].length; c++) {
        const char = faceSprite[r][c];
        const color = window.Player.PALETTE[char];
        if (color && color !== 'transparent') {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(iconX + c * iconScale, iconY + r * iconScale, iconScale, iconScale);
        }
      }
    }
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(`x ${this.lives}`, iconX + faceSprite[0].length * iconScale + 8, iconY + 2);

    this.ctx.restore();
  }

  /**
   * スタート画面の描画
   */
  drawStartScreen() {
    this.ctx.save();

    // 背景グラデーション
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    grad.addColorStop(0, '#0f051d');
    grad.addColorStop(1, '#2c1e45');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 遠景の山
    this.ctx.fillStyle = '#1c0c32';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height);
    this.ctx.lineTo(150, 200);
    this.ctx.lineTo(300, this.canvas.height);
    this.ctx.lineTo(512, this.canvas.height);
    this.ctx.fill();

    // 日の丸風の赤い円（和風・デデンッッ演出）
    this.ctx.fillStyle = 'rgba(230, 0, 18, 0.65)';
    this.ctx.beginPath();
    this.ctx.arc(this.canvas.width / 2, 145, 65, 0, Math.PI * 2);
    this.ctx.fill();

    // タイトル文字（書道家風・墨文字に白い縁取り）
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 36px "Yuji Syuku", "Yu Mincho", "MS Mincho", serif';
    this.ctx.strokeStyle = '#ffffff'; // 白い縁取り
    this.ctx.lineWidth = 4;
    this.ctx.strokeText('客室清掃員奮闘記', this.canvas.width / 2, 140);
    
    this.ctx.fillStyle = '#111111'; // 墨色
    this.ctx.fillText('客室清掃員奮闘記', this.canvas.width / 2, 140);
    
    // サブタイトル（金色に黒い縁取り）
    this.ctx.font = 'bold 18px "Yuji Syuku", "Yu Mincho", "MS Mincho", serif';
    this.ctx.strokeStyle = '#000000'; // 黒い縁取り
    this.ctx.lineWidth = 3;
    this.ctx.strokeText('～令和編～', this.canvas.width / 2, 185);
    
    this.ctx.fillStyle = '#ffcc00'; // 金色
    this.ctx.fillText('～令和編～', this.canvas.width / 2, 185);

    // プレススタート指示 (点滅アニメーション)
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '10px "Press Start 2P", monospace';
      this.ctx.fillText('PRESS START TO PLAY', this.canvas.width / 2, 260);
    }

    // コントロールガイド
    this.ctx.fillStyle = '#a0a0c0';
    this.ctx.font = '8px "Press Start 2P", monospace';
    this.ctx.fillText('MOVE: ARROW KEYS / AD', this.canvas.width / 2, 330);
    this.ctx.fillText('JUMP: SPACE / Z      DASH: SHIFT / X', this.canvas.width / 2, 350);

    // クレジット
    this.ctx.fillStyle = '#5c5c77';
    this.ctx.fillText('PRODUCED BY ANTIGRAVITY IDE', this.canvas.width / 2, 410);

    this.ctx.restore();
  }
}

// ゲーム起動
window.addEventListener('load', () => {
  window.GameInstance = new Game();
  
  // タイトル画面表示時にPWAインストール・外部ブラウザ誘導モーダルを表示
  if (window.PWAController && window.GameInstance.state === 'TITLE') {
    window.PWAController.showModal();
  }
});

// グローバル公開
window.ThrownMop = ThrownMop;
