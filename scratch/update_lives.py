import re

with open("e:/AI_Playground/mario/js/game.js", "r", encoding="utf-8") as f:
    content = f.read()

old_code = r"    // 残機表示 \(左下に小さく表示\)\n    this\.ctx\.fillText\(`LIVES x\$\{this\.lives\}`\, 24, this\.canvas\.height - 24\);"

new_code = """    // 残機表示 (顔アイコンと × X)
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
    this.ctx.fillText(`x ${this.lives}`, iconX + faceSprite[0].length * iconScale + 8, iconY + 2);"""

content = re.sub(old_code, new_code, content)

with open("e:/AI_Playground/mario/js/game.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Lives UI updated.")
