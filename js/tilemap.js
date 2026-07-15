/**
 * ハテナブロックから出現するアイテムのクラス (コイン or CIAOちゅ〜る)
 */
class GameItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'coin' または 'churu'
    this.width = 20;
    this.height = 20;
    
    // 出現時に上方向に少し飛び出す
    this.vx = 0; // 左右に散らずに真上に出て着地するようにする
    this.vy = -6.0;
    
    this.onGround = false;
    this.shouldRemove = false;
    this.bounceTimer = 0; // コインの演出用
    
    // 万能洗剤のドット絵 (12x14) スプレーボトルのような形
    // 5 = ピンク(ボトル), 2 = 白(ラベル/ノズル), 6 = 青(液体/文字)
    this.churuSprite = [
      "....222.....",
      "....222.....",
      "...22222....",
      "..2222222...",
      ".....22.....",
      "....5555....",
      "...555555...",
      "..55555555..",
      "..52222225..",
      "..52666625..",
      "..52266225..",
      "..52222225..",
      "..55555555..",
      "...555555..."
    ];
  }

  update(map) {
    this.bounceTimer++;
    if (this.type === 'coin') {
      // コインは自動で上にはねて消え、プレイヤーに加算される
      this.y += this.vy;
      this.vy += 0.4; // 緩やかな重力
      if (this.bounceTimer > 25) {
        this.shouldRemove = true;
      }
    } else if (this.type === 'churu' || this.type === 'mop') {
      // ちゅ〜るとモップは物理演算で落下し、地面に着地すると自動で左右に歩き出す (マリオのキノコ風)
      this.vy += 0.4; // 重力
      
      // 着地中かつ横移動していない場合、右に歩き出す
      if (this.onGround && this.vx === 0) {
        this.vx = 1.0; 
      }
      
      this.x += this.vx;
      // 壁との衝突解決 (ぶつかったら反転)
      const overlapX = map.getTileOverlapX(this);
      if (overlapX !== 0) {
        this.x -= overlapX;
        this.vx *= -1;
      }
      
      this.y += this.vy;
      this.onGround = false;
      map.checkCollisionsY(this);
      
      // 画面外に落ちたら消滅
      if (this.y > map.height * map.tileSize + 100) {
        console.log(`${this.type} fell out of bounds! Final position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
        this.shouldRemove = true;
      }
    }
  }

  draw(ctx, cameraX) {
    const drawX = Math.floor(this.x - cameraX);
    const drawY = Math.floor(this.y);

    if (drawX < -20 || drawX > ctx.canvas.width + 20) return;

    if (this.type === 'coin') {
      // コインの描画 (金色の楕円)
      ctx.fillStyle = '#ffe600';
      ctx.strokeStyle = '#b88600';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // 回転アニメーション風に幅を伸縮
      const scaleX = Math.abs(Math.sin(this.bounceTimer * 0.3));
      ctx.ellipse(drawX + this.width / 2, drawY + this.height / 2, (this.width / 2) * scaleX, this.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'churu') {
      // CIAOちゅ〜るのプロシージャル描画
      const scale = 2; // ドットスケール
      const rows = this.churuSprite.length;
      const cols = this.churuSprite[0].length;
      const offsetX = (this.width - cols * scale) / 2;
      const offsetY = (this.height - rows * scale) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const char = this.churuSprite[r][c];
          let color = 'transparent';
          if (char === '5') color = '#ff66b2'; // ピンク（ボトル）
          if (char === '2') color = '#ffffff'; // 白（ラベル）
          if (char === '6') color = '#0066cc'; // 青（文字/ロゴ）

          if (color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(drawX + offsetX + c * scale, drawY + offsetY + r * scale, scale, scale);
          }
        }
      }
    } else if (this.type === 'mop') {
      // 赤いハンディモップアイテムの描画 (ふわふわヘッド＋茶色の柄)
      ctx.save();
      // 少し浮き沈みするアニメーション
      const bounceY = Math.sin(this.bounceTimer * 0.1) * 3;
      const drawMX = drawX + (this.width - 16)/2;
      const drawMY = drawY + (this.height - 16)/2 + bounceY;

      ctx.strokeStyle = '#804020';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(drawMX + 2, drawMY + 14);
      ctx.lineTo(drawMX + 8, drawMY + 8);
      ctx.stroke();

      ctx.fillStyle = '#ff3333';
      ctx.beginPath();
      ctx.arc(drawMX + 10, drawMY + 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // フワフワディテール
      ctx.fillStyle = '#ff9999';
      ctx.fillRect(drawMX + 8, drawMY + 4, 2, 2);
      ctx.fillRect(drawMX + 11, drawMY + 7, 2, 2);
      ctx.restore();
    }
  }
}

/**
 * 叩かれたときに跳ねるブロックのアニメーションを管理するクラス
 */
class BouncingBlock {
  constructor(tx, ty, tileId, isChuru = false) {
    this.tx = tx;
    this.ty = ty;
    this.tileId = tileId;
    this.isChuru = isChuru;
    this.offsetY = 0;
    this.vy = -3.0; // 上向きの初速
    this.timer = 0;
    this.done = false;
  }

  update() {
    this.offsetY += this.vy;
    this.vy += 0.5; // 重力で戻る
    this.timer++;
    
    if (this.offsetY >= 0 && this.timer > 5) {
      this.offsetY = 0;
      this.done = true;
    }
  }
}

/**
 * タイルマップクラス
 */
class TileMap {
  constructor(stageName) {
    this.stageName = stageName;
    this.tileSize = 32;
    
    // タイルIDの定義
    this.TILES = {
      AIR: 0,
      GRASS: 1,      // 草地面
      DIRT: 2,       // 土
      BRICK: 3,      // レンガブロック
      QUESTION_COIN: 4, // ハテナブロック(コイン)
      QUESTION_CHURU: 5, // ハテナブロック(ちゅ〜る)
      USED_BLOCK: 6,  // 使用済み鉄ブロック
      PIPE_TL: 7,    // 土管左上
      PIPE_TR: 8,    // 土管右上
      PIPE_BL: 9,    // 土管左下
      PIPE_BR: 10,   // 土管右下
      GOAL_BAR: 11,  // ゴールゲートバー
      GOAL_POLE: 12, // ゴール支柱
      CAVE_GRASS: 13, // 洞窟地面
      CAVE_DIRT: 14  // 洞窟壁
    };

    // 1-1 マップの生定義 (幅220タイル, 高さ14タイル)
    const rawMap1_1 = [
"............................................................................................................................................................................................................................",
      "............................................................................................................................................................................................................................",
      "............................................................................................................................................................................................................................",
      "......................................................................................................................................................................................................................H.....",
      "......................................................................................................................................................................................................................|.....",
      ".......................................................................................................................................#C#............................................................................|.....",
      "......................................................................................................................................................................................................................|.....",
      ".............?......?........#?#.....#C#?#..................................................................................................?..............#?#?#?#....................................................|.....",
      "......................................................................................................................................................................................................................|.....",
      "...................................................[]...................[].......####....#######..............########............[]....................................................[]............................|.....",
      "...................................................()...................()......######..#########............##########...........()....................................................()............................|.....",
      "GGGGGGGGGGGGGGGGGGGGGGGGGGGGG...GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG...GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG......GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG....GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDD...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD......DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD",
      "DDDDDDDDDDDDDDDDDDDDDDDDDDDDD...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD......DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD"
    ];

    // 1-2 マップの生定義 (洞窟, 幅240タイル, 高さ14タイル)
    const rawMap1_2 = [
"RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      "................................................................................................................................................................................................................................................",
      "..........................................................................................................................................................................................................................................H.....",
      "..........................................................................................................................................................................................................................................|.....",
      "..........................................................................................................................................................................##..............................................................|.....",
      "........................................................................................................................................................................####..............................................................|.....",
      "...................................................................................................................................................####...............######..............................................................|.....",
      ".............?....C........####.........###..###............####........#?#......................................................####............########.............########............................................................|.....",
      ".................................................................................................................####.....................................................................................................................|.....",
      "......[]..............##..........##..................##...........##...................#####........[]........######......[]...........##....................[].............................[]...........................................|.....",
      "RRRRRR()RRRRRRRRRRRRRRRRRRRR...RRRRRRR...RRRRRRRRRRRRRRRRRR...RRRRRRRRRRRRRRRR.....RRRRRRRRRRRRRRRRRR()RRRRRRRRRRRRRRRRRRRR()RRRRRRRRRRRRRRRRRR............RRRR()RRRRRRRRRRRRRRRRRRRRRRRRRRRR()RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBB...BBBBBBB...BBBBBBBBBBBBBBBBBB...BBBBBBBBBBBBBBBB.....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB............BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBB...BBBBBBB...BBBBBBBBBBBBBBBBBB...BBBBBBBBBBBBBBBB.....BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB............BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
    ];

    // 生マップの解析
    const rawMap = stageName === '1-1' ? rawMap1_1 : rawMap1_2;
    this.height = rawMap.length;
    this.width = rawMap[0].length;
    this.grid = [];

    for (let r = 0; r < this.height; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.width; c++) {
        const char = rawMap[r][c];
        this.grid[r][c] = this.parseTileChar(char);
      }
    }

    // 動的なリスト
    this.items = [];
    this.bouncingBlocks = [];
    
    // 背景用雲の初期化 (1-1用)
    this.clouds = [
      { x: 100, y: 50, speed: 0.1, size: 60 },
      { x: 300, y: 30, speed: 0.08, size: 80 },
      { x: 600, y: 70, speed: 0.12, size: 50 },
      { x: 900, y: 40, speed: 0.07, size: 90 }
    ];
  }

  /**
   * 文字をタイルIDにパース
   */
  parseTileChar(char) {
    switch(char) {
      case 'G': return this.TILES.GRASS;
      case 'D': return this.TILES.DIRT;
      case '#': return this.TILES.BRICK;
      case '?': return this.TILES.QUESTION_COIN;
      case 'C': return this.TILES.QUESTION_CHURU;
      case '[': return this.TILES.PIPE_TL;
      case ']': return this.TILES.PIPE_TR;
      case '(': return this.TILES.PIPE_BL;
      case ')': return this.TILES.PIPE_BR;
      case 'H': return this.TILES.GOAL_BAR;
      case '|': return this.TILES.GOAL_POLE;
      case 'R': return this.TILES.CAVE_GRASS;
      case 'B': return this.TILES.CAVE_DIRT;
      default:  return this.TILES.AIR;
    }
  }

  /**
   * 特定の座標が衝突判定を持つソリッドタイルか
   */
  isSolidTile(tileId) {
    return tileId === this.TILES.GRASS ||
           tileId === this.TILES.DIRT ||
           tileId === this.TILES.BRICK ||
           tileId === this.TILES.QUESTION_COIN ||
           tileId === this.TILES.QUESTION_CHURU ||
           tileId === this.TILES.USED_BLOCK ||
           tileId === this.TILES.PIPE_TL ||
           tileId === this.TILES.PIPE_TR ||
           tileId === this.TILES.PIPE_BL ||
           tileId === this.TILES.PIPE_BR ||
           tileId === this.TILES.CAVE_GRASS ||
           tileId === this.TILES.CAVE_DIRT;
  }

  isSolidTileAt(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) {
      // 画面境界外（左右、上下、奈落）はすべて空気扱い
      return false;
    }
    return this.isSolidTile(this.grid[ty][tx]);
  }

  getTileAt(tx, ty) {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return this.TILES.AIR;
    return this.grid[ty][tx];
  }

  setTileAt(tx, ty, tileId) {
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.grid[ty][tx] = tileId;
    }
  }

  /**
   * X方向の重なり量を取得（押し戻し用）
   */
  getTileOverlapX(entity) {
    const left = entity.x;
    const right = entity.x + entity.width;
    const top = entity.y;
    const bottom = entity.y + entity.height;

    const tileLeft = Math.floor(left / this.tileSize);
    const tileRight = Math.floor((right - 0.1) / this.tileSize);
    const tileTop = Math.floor(top / this.tileSize);
    const tileBottom = Math.floor((bottom - 0.1) / this.tileSize);

    // X軸の移動に対して、接触しているタイルの衝突チェック
    for (let ty = tileTop; ty <= tileBottom; ty++) {
      // 左側壁衝突
      if (entity.vx < 0 && this.isSolidTileAt(tileLeft, ty)) {
        return left - (tileLeft + 1) * this.tileSize; // 負の値 (左に戻す)
      }
      // 右側壁衝突
      if (entity.vx > 0 && this.isSolidTileAt(tileRight, ty)) {
        return right - tileRight * this.tileSize; // 正の値 (右に戻す)
      }
    }
    return 0;
  }

  /**
   * Y方向の重なり量を取得（押し戻し用）
   */
  getTileOverlapY(entity) {
    const left = entity.x;
    const right = entity.x + entity.width;
    const top = entity.y;
    const bottom = entity.y + entity.height;

    const tileLeft = Math.floor(left / this.tileSize);
    const tileRight = Math.floor((right - 0.1) / this.tileSize);
    const tileTop = Math.floor(top / this.tileSize);
    const tileBottom = Math.floor((bottom - 0.1) / this.tileSize);

    for (let tx = tileLeft; tx <= tileRight; tx++) {
      // 天井衝突
      if (entity.vy < 0 && this.isSolidTileAt(tx, tileTop)) {
        return top - (tileTop + 1) * this.tileSize; // 負の値 (下に押し戻す)
      }
      // 床面衝突
      if (entity.vy > 0 && this.isSolidTileAt(tx, tileBottom)) {
        return bottom - tileBottom * this.tileSize; // 正の値 (上に押し戻す)
      }
    }
    return 0;
  }

  /**
   * エンティティのX方向衝突解決
   */
  checkCollisionsX(entity) {
    const overlapX = this.getTileOverlapX(entity);
    if (overlapX !== 0) {
      entity.x -= overlapX;
      entity.vx = 0;
    }
  }

  /**
   * エンティティのY方向衝突解決、およびブロック叩き検知
   */
  checkCollisionsY(entity) {
    const overlapY = this.getTileOverlapY(entity);
    if (overlapY !== 0) {
      if (entity.vy > 0) {
        entity.onGround = true;
      } else if (entity.vy < 0 && entity instanceof Player) {
        // プレイヤーが上昇中に天井に衝突した場合、ブロック叩きチェック
        this.checkBlockHit(entity);
      }
      entity.y -= overlapY;
      entity.vy = 0;
    }
  }

  /**
   * プレイヤーが天井ブロックを叩いたかチェック
   */
  checkBlockHit(player) {
    // プレイヤーの頭上中央座標
    const headX = player.x + player.width / 2;
    const headY = player.y - 2; // 少し上

    const tx = Math.floor(headX / this.tileSize);
    const ty = Math.floor(headY / this.tileSize);

    const tileId = this.getTileAt(tx, ty);

    if (tileId === this.TILES.BRICK) {
      // レンガブロックを叩いた
      if (player.powerState >= 1) {
        // スーパーネコ（またはモップ状態）なら破壊
        this.setTileAt(tx, ty, this.TILES.AIR);
        window.AudioManager.playStomp(); // 破壊音代用
        // ブロック破片アニメーション (四方に散るパーティクル)
        if (window.GameInstance) {
          const blockCX = tx * this.tileSize + this.tileSize / 2;
          const blockCY = ty * this.tileSize + this.tileSize / 2;
          window.GameInstance.spawnParticles(blockCX - 8, blockCY - 8, '#cc5a1b', 2, 'rect');
          window.GameInstance.spawnParticles(blockCX + 8, blockCY - 8, '#cc5a1b', 2, 'rect');
          window.GameInstance.spawnParticles(blockCX - 8, blockCY + 8, '#cc5a1b', 2, 'rect');
          window.GameInstance.spawnParticles(blockCX + 8, blockCY + 8, '#cc5a1b', 2, 'rect');
        }
      } else {
        // ちびネコなら跳ねるだけ
        this.triggerBouncingBlock(tx, ty, tileId);
      }
    } else if (tileId === this.TILES.QUESTION_COIN) {
      // ハテナブロック（コイン）
      this.setTileAt(tx, ty, this.TILES.USED_BLOCK);
      this.triggerBouncingBlock(tx, ty, this.TILES.USED_BLOCK);
      // コインアイテム出現
      this.spawnItem(tx, ty, 'coin');
      window.AudioManager.playCoin();
    } else if (tileId === this.TILES.QUESTION_CHURU) {
      // ハテナブロック（ちゅ〜る/洗剤/モップ）
      this.setTileAt(tx, ty, this.TILES.USED_BLOCK);
      this.triggerBouncingBlock(tx, ty, this.TILES.USED_BLOCK, true);
      // プレイヤーがパワー状態1以上であればハンディモップ、0なら洗剤（ちゅ〜る）
      const spawnType = player.powerState >= 1 ? 'mop' : 'churu';
      this.spawnItem(tx, ty, spawnType);
      // 出現SE
      window.AudioManager.playSound('triangle', 330, 660, 0.3, 0.4);
    }
  }

  triggerBouncingBlock(tx, ty, resultTileId, isChuru = false) {
    // 跳ねるアニメーションの登録
    const bounce = new BouncingBlock(tx, ty, resultTileId, isChuru);
    this.bouncingBlocks.push(bounce);
    // 一時的にグリッド上は空（または空気）にして、跳ねるブロッククラス側で描画する
    // ただし、跳ねている間もソリッドなので、衝突判定用には USED_BLOCK を置いておき、描画だけオフにする
    this.grid[ty][tx] = this.TILES.AIR; // 描画から除外するため
    bounce.collisionTile = resultTileId; // 終了後に書き戻す
  }

  spawnItem(tx, ty, type) {
    const itemX = tx * this.tileSize + (this.tileSize - 20) / 2;
    const itemY = ty * this.tileSize - 20;
    const item = new GameItem(itemX, itemY, type);
    this.items.push(item);
    console.log(`Spawned item: ${type} at (${itemX.toFixed(1)}, ${itemY.toFixed(1)})`);
  }

  updateItemsAndBlocks() {
    // ブロック跳ねアニメーションの更新
    for (let i = this.bouncingBlocks.length - 1; i >= 0; i--) {
      const block = this.bouncingBlocks[i];
      block.update();
      if (block.done) {
        // アニメーション完了したら元の場所にソリッドタイルを書き戻す
        this.grid[block.ty][block.tx] = block.collisionTile;
        this.bouncingBlocks.splice(i, 1);
      }
    }

    // アイテムの物理・寿命更新
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.update(this);
      if (item.shouldRemove) {
        this.items.splice(i, 1);
      }
    }
  }

  /**
   * パララックス背景の描画
   */
  drawBackground(ctx, cameraX) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    if (this.stageName === '1-1') {
      // 1-1 ホテルの廊下
      // 高級感のある壁紙
      const wallGrad = ctx.createLinearGradient(0, 0, 0, h);
      wallGrad.addColorStop(0, '#f4e8c1'); // クリーム色
      wallGrad.addColorStop(1, '#d8cba0');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, w, h);

      // 壁紙のストライプ模様
      ctx.fillStyle = 'rgba(200, 180, 140, 0.3)';
      for (let i = -(cameraX % 40); i < w; i += 40) {
        ctx.fillRect(i, 0, 20, h);
      }

      // 幅木（壁の下部）
      ctx.fillStyle = '#6b4c3a'; // 濃い木目色
      ctx.fillRect(0, h - 40, w, 40);

      // 遠景（廊下の奥へ続く柱や装飾）
      ctx.fillStyle = '#b09b71'; 
      const pillarScale = 0.5; // スクロール速度
      const pOffset = -(cameraX * pillarScale) % 300;
      
      for (let i = pOffset - 300; i < w + 300; i += 300) {
        // 柱
        ctx.fillRect(i, 0, 40, h);
        // 柱の影
        ctx.fillStyle = '#8e7a56';
        ctx.fillRect(i + 30, 0, 10, h);
        ctx.fillStyle = '#b09b71'; // 戻す
        
        // シャンデリア風の照明
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(i + 150, 40, 20, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#fffae6';
        ctx.fillRect(i + 145, 40, 10, 15); // 光る部分
      }

    } else {
      // 1-2 散らかって暗いスイートルーム / バックヤード
      const roomGrad = ctx.createLinearGradient(0, 0, 0, h);
      roomGrad.addColorStop(0, '#2b2520'); // 薄暗い茶色
      roomGrad.addColorStop(1, '#1a1612');
      ctx.fillStyle = roomGrad;
      ctx.fillRect(0, 0, w, h);

      // 剥がれた壁紙や汚れのパララックス表現
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; 
      const dirtScale = 0.15;
      const dOffset = -(cameraX * dirtScale) % w;
      
      const drawDirt = (ox) => {
        // 大きなシミ
        ctx.beginPath();
        ctx.ellipse(ox + 100, 150, 40, 60, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 剥がれた壁紙
        ctx.fillRect(ox + 300, 50, 60, 100);
        
        // 謎の液体跡
        ctx.beginPath();
        ctx.moveTo(ox + 200, 0);
        ctx.lineTo(ox + 210, 120);
        ctx.lineTo(ox + 220, 150);
        ctx.lineTo(ox + 190, 150);
        ctx.fill();
      };

      drawDirt(dOffset);
      drawDirt(dOffset + w);
    }
  }

  /**
   * マップタイルの描画
   */
  draw(ctx, cameraX) {
    const startCol = Math.floor(cameraX / this.tileSize);
    const endCol = startCol + Math.ceil(ctx.canvas.width / this.tileSize) + 1;

    for (let r = 0; r < this.height; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (c < 0 || c >= this.width) continue;

        const tileId = this.grid[r][c];
        const drawX = Math.floor(c * this.tileSize - cameraX);
        const drawY = r * this.tileSize;

        if (tileId !== this.TILES.AIR) {
          this.drawTile(ctx, drawX, drawY, tileId);
        }
      }
    }

    // 跳ねているブロックの描画
    this.bouncingBlocks.forEach(block => {
      const drawX = Math.floor(block.tx * this.tileSize - cameraX);
      const drawY = Math.floor(block.ty * this.tileSize + block.offsetY);
      this.drawTile(ctx, drawX, drawY, block.tileId);
    });

    // アイテムの描画
    this.items.forEach(item => item.draw(ctx, cameraX));
  }

  /**
   * 各種タイルのプロシージャル描画
   */
  drawTile(ctx, x, y, tileId) {
    const s = this.tileSize;

    switch(tileId) {
      case this.TILES.GRASS: // 明るい草地面 (草原)
        ctx.fillStyle = '#4cb016'; // 草
        ctx.fillRect(x, y, s, 8);
        ctx.fillStyle = '#8c5e34'; // 土
        ctx.fillRect(x, y + 8, s, s - 8);
        // 芝生のギザギザドット表現
        ctx.fillStyle = '#307e0c';
        for (let i = 0; i < s; i += 8) {
          ctx.fillRect(x + i, y + 6, 4, 2);
        }
        break;

      case this.TILES.DIRT: // 地下土層
        ctx.fillStyle = '#8c5e34';
        ctx.fillRect(x, y, s, s);
        // 土のレトロテクスチャ（ドットの斑点）
        ctx.fillStyle = '#6b4321';
        ctx.fillRect(x + 4, y + 6, 4, 4);
        ctx.fillRect(x + 18, y + 20, 4, 4);
        ctx.fillRect(x + 10, y + 24, 4, 4);
        ctx.fillRect(x + 24, y + 8, 4, 4);
        break;

      case this.TILES.CAVE_GRASS: // 洞窟の冷たい地面 (1-2用)
        ctx.fillStyle = '#6c5c77'; // 暗い紫がかったグレー
        ctx.fillRect(x, y, s, 8);
        ctx.fillStyle = '#3c3245'; // 濃いグレー
        ctx.fillRect(x, y + 8, s, s - 8);
        ctx.fillStyle = '#4c3f58';
        for (let i = 0; i < s; i += 8) {
          ctx.fillRect(x + i, y + 6, 4, 2);
        }
        break;

      case this.TILES.CAVE_DIRT: // 洞窟の土層
        ctx.fillStyle = '#3c3245';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#2c2235';
        ctx.fillRect(x + 4, y + 6, 4, 4);
        ctx.fillRect(x + 18, y + 20, 4, 4);
        ctx.fillRect(x + 10, y + 24, 4, 4);
        ctx.fillRect(x + 24, y + 8, 4, 4);
        break;

      case this.TILES.BRICK: // レンガブロック
        ctx.fillStyle = '#cc5a1b'; // レンガ色
        ctx.fillRect(x, y, s, s);
        // 枠線
        ctx.strokeStyle = '#f8b070'; // 明るい枠線
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
        ctx.strokeStyle = '#632502'; // 暗い影
        ctx.beginPath();
        ctx.moveTo(x + 1, y + s - 1);
        ctx.lineTo(x + s - 1, y + s - 1);
        ctx.lineTo(x + s - 1, y + 1);
        ctx.stroke();
        // レンガの溝目
        ctx.fillStyle = '#632502';
        ctx.fillRect(x, y + 15, s, 2); // 横分割
        ctx.fillRect(x + 15, y, 2, 15); // 縦分割1
        ctx.fillRect(x + 8, y + 17, 2, 15); // 縦分割2
        ctx.fillRect(x + 24, y + 17, 2, 15);
        break;

      case this.TILES.QUESTION_COIN:
      case this.TILES.QUESTION_CHURU:
        // ハテナブロック (黄色)
        ctx.fillStyle = '#f0c010';
        ctx.fillRect(x, y, s, s);
        // 枠と影
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
        ctx.strokeStyle = '#806000';
        ctx.strokeRect(x + 2, y + 2, s - 4, s - 4);
        // 「？」マーク
        ctx.font = 'bold 20px ' + (window.Input ? 'var(--font-sans)' : 'sans-serif');
        ctx.fillStyle = '#806000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + s/2, y + s/2 + 1);
        // 四隅のドット
        ctx.fillStyle = '#806000';
        ctx.fillRect(x + 4, y + 4, 3, 3);
        ctx.fillRect(x + s - 7, y + 4, 3, 3);
        ctx.fillRect(x + 4, y + s - 7, 3, 3);
        ctx.fillRect(x + s - 7, y + s - 7, 3, 3);
        break;

      case this.TILES.USED_BLOCK: // 使用済み鉄ブロック
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(x, y, s, s);
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, s - 2, s - 2);
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(x + 4, y + 4, 4, 4);
        ctx.fillRect(x + s - 8, y + 4, 4, 4);
        ctx.fillRect(x + 4, y + s - 8, 4, 4);
        ctx.fillRect(x + s - 8, y + s - 8, 4, 4);
        break;

      case this.TILES.PIPE_TL: // 土管左上
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#80ff80'; // ハイライト
        ctx.fillRect(x + 4, y, 6, s);
        ctx.strokeStyle = '#004000'; // 黒枠
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, s, s);
        break;
      case this.TILES.PIPE_TR: // 土管右上
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#007000'; // 影
        ctx.fillRect(x + s - 10, y, 10, s);
        ctx.strokeStyle = '#004000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, s, s);
        break;
      case this.TILES.PIPE_BL: // 土管左下 (少し細い)
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x + 4, y, s - 4, s);
        ctx.fillStyle = '#80ff80';
        ctx.fillRect(x + 8, y, 6, s);
        ctx.strokeStyle = '#004000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 4, y + s);
        ctx.stroke();
        break;
      case this.TILES.PIPE_BR: // 土管右下
        ctx.fillStyle = '#00a800';
        ctx.fillRect(x, y, s - 4, s);
        ctx.fillStyle = '#007000';
        ctx.fillRect(x + s - 14, y, 10, s);
        ctx.strokeStyle = '#004000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + s - 4, y);
        ctx.lineTo(x + s - 4, y + s);
        ctx.stroke();
        break;

      case this.TILES.GOAL_BAR: // ゴールゲートバー（マリオワールド風の白黒市松模様）
        // 市松模様
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, s/2, s/2);
        ctx.fillRect(x + s/2, y + s/2, s/2, s/2);
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, s, s);
        break;
      
      case this.TILES.GOAL_POLE: // ゴール支柱 (細いポール)
        ctx.fillStyle = '#d0d0d0'; // グレーのポール
        ctx.fillRect(x + 12, y, 8, s);
        ctx.fillStyle = '#ffffff'; // ハイライト
        ctx.fillRect(x + 14, y, 2, s);
        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 12, y, 8, s);
        break;
    }
  }
}

// グローバルに公開
window.TileMap = TileMap;
