/**
 * Web Audio API を用いた 8-bit 風シンセサイザー（効果音＆BGM）
 */
class RetroAudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false; // 初期状態はミュート解除（UI側でハンドリング）
    this.initialized = false;
    
    // BGM用タイマーなど
    this.bgmInterval = null;
    this.currentBgm = null;
    this.bgmTempo = 130; // BPM
    this.bgmStep = 0;
    this.bgmSequence = [];
    
    // BGMの音符の定義 (周波数マップ)
    this.NOTES = {
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51, 'G6': 1567.98,
      '-': 0 // 休符
    };

    // 1-1 BGM (草原ステージ): 陽気で軽快なメロディ (16ステップの繰り返し)
    this.bgm1_1 = [
      'E5', 'E5', '-', 'E5', '-', 'C5', 'E5', '-',
      'G5', '-', '-', '-', 'G4', '-', '-', '-',
      'C5', '-', '-', 'G4', '-', '-', 'E4', '-',
      'A4', '-', 'B4', '-', 'A#4', 'A4', '-', '-',
      'G4', 'E5', 'G5', 'A5', '-', 'F5', 'G5', '-',
      'E5', '-', 'C5', 'D5', 'B4', '-', '-', '-'
    ];

    // 1-2 BGM (洞窟ステージ): 少し不気味でタイトな地下風メロディ
    this.bgm1_2 = [
      'C4', 'E3', 'G3', 'C4', 'D4', 'D#4', '-', 'D4',
      'A#3', 'D3', 'F3', 'A#3', 'C4', 'C#4', '-', 'C4',
      'G3', 'B2', 'D3', 'G3', 'G#3', 'A3', '-', 'G3',
      'C4', '-', 'G3', '-', 'E3', '-', 'C3', '-'
    ];
  }

  /**
   * ユーザーアクションに応じてAudioContextを初期化する
   */
  init() {
    if (this.initialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime); // マスター音量は控えめに
      this.masterGain.connect(this.ctx.destination);
      
      this.initialized = true;
      console.log("Retro Audio Initialized!");
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser.", e);
    }
  }

  setMute(mute) {
    this.muted = mute;
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.15, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.setMute(!this.muted);
    return this.muted;
  }

  /**
   * 単発の矩形波または三角波による効果音の再生用ヘルパー
   */
  playSound(type, startFreq, endFreq, duration, volume = 0.5) {
    if (!this.initialized) this.init();
    if (this.muted || !this.ctx) return;
    
    // ブラウザがAudioContextをサスペンドしている場合は復帰させる
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    
    // 周波数（ピッチ）の設定。endFreqがあればスイープさせる
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    if (endFreq && endFreq !== startFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }

    // 音量（ゲイン）の急激な減衰によるレトロなポンという音抜け
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  /**
   * ノイズ音源の再生（踏みつけ音や爆発音用）
   */
  playNoiseSound(duration, volume = 0.5) {
    if (!this.initialized) this.init();
    if (this.muted || !this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // ホワイトノイズバッファの生成
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    // バンドパスフィルターを通して、踏みつけたような「ペシッ」という音にする
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800; // 800Hz付近を強調

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    noiseNode.start();
    noiseNode.stop(this.ctx.currentTime + duration);
  }

  // --- 各種効果音 ---

  /**
   * ジャンプ音 (ピッチが急上昇するピコピコ音)
   */
  playJump() {
    this.playSound('square', 180, 880, 0.16, 0.6);
  }

  /**
   * コイン取得音 (ピコーンと鳴る2和音)
   */
  playCoin() {
    if (!this.initialized) this.init();
    if (this.muted || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // 1音目: B5 (987.77Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.setValueAtTime(0.4, now + 0.08);
    gain1.gain.linearRampToValueAtTime(0.01, now + 0.09);
    
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.09);

    // 2音目: E6 (1318.51Hz) を少し遅らせて重ねる
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.4, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.35);
  }

  /**
   * CIAOちゅ〜る出現 / パワーアップ音 (アルペジオメロディ)
   */
  playPowerUp() {
    if (!this.initialized) this.init();
    if (this.muted || !this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.5, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.2);
    });
  }

  /**
   * ダメージ / ちびに戻る音 (アルペジオ下降)
   */
  playPowerDown() {
    if (!this.initialized) this.init();
    if (this.muted || !this.ctx) return;

    const notes = [783.99, 659.25, 523.25, 392.00, 329.63, 261.63]; // G5, E5, C5, G4, E4, C4
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth'; // ちょっとビリビリした警告音調
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.3, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.15);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  /**
   * 敵を踏んだ音
   */
  playStomp() {
    // 軽いノイズ音を0.1秒再生
    this.playNoiseSound(0.12, 0.6);
  }

  /**
   * スコア集計音 (ピピッという短い高音)
   */
  playTick() {
    this.playSound('square', 1200, 1200, 0.04, 0.2);
  }

  /**
   * ミス / 落下したときの音
   */
  playDie() {
    // 急降下＋悲痛な低音
    this.playSound('sawtooth', 400, 60, 0.6, 0.7);
  }

  /**
   * ステージクリアファンファーレ
   */
  playStageClear() {
    if (!this.initialized) this.init();
    if (this.muted || !this.ctx) return;
    
    // ファンファーレ音符: G4, C5, E5, G5, E5, G5 (最後長め)
    const melody = [392.00, 523.25, 659.25, 783.99, 659.25, 783.99];
    const duration = [0.15, 0.15, 0.15, 0.15, 0.15, 0.6];
    const delay = [0, 0.15, 0.3, 0.45, 0.6, 0.75];
    const now = this.ctx.currentTime;

    melody.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + delay[idx]);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.5, now + delay[idx]);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay[idx] + duration[idx]);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay[idx]);
      osc.stop(now + delay[idx] + duration[idx]);
    });
  }

  // --- BGM エンジン ---

  /**
   * 指定したステージのBGMをループ再生する
   * @param {string} stage - '1-1' または '1-2'
   */
  playBGM(stage) {
    if (!this.initialized) this.init();
    
    // 既存のBGMを停止
    this.stopBGM();
    
    this.currentBgm = stage;
    this.bgmStep = 0;
    
    if (stage === '1-1') {
      this.bgmSequence = this.bgm1_1;
      this.bgmTempo = 135;
    } else if (stage === '1-2') {
      this.bgmSequence = this.bgm1_2;
      this.bgmTempo = 120; // 洞窟は少し遅めに
    } else {
      return;
    }

    const stepDuration = 60 / this.bgmTempo / 2; // 八分音符の間隔
    
    // メロディのスケジューリングループ
    const playNextStep = () => {
      if (this.muted || !this.ctx || this.ctx.state === 'suspended') {
        // ミュート中、またはサスペンド中はタイマーだけ進める
        this.bgmStep = (this.bgmStep + 1) % this.bgmSequence.length;
        this.bgmInterval = setTimeout(playNextStep, stepDuration * 1000);
        return;
      }

      const noteName = this.bgmSequence[this.bgmStep];
      const freq = this.NOTES[noteName] || 0;

      if (freq > 0) {
        // 主旋律
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = this.currentBgm === '1-2' ? 'sawtooth' : 'triangle'; // 1-2は重い音、1-1は柔らかい音
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // 優しい音量で
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + stepDuration * 0.9);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + stepDuration);

        // 簡単なベース伴奏を自動追加してリッチな2和音にする
        const baseOsc = this.ctx.createOscillator();
        const baseGain = this.ctx.createGain();
        baseOsc.type = 'sine'; // 低音は丸いサイン波
        // 主旋律の1オクターブ下、またはルート音
        const baseFreq = freq / 2;
        baseOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        baseGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        baseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + stepDuration * 0.9);
        
        baseOsc.connect(baseGain);
        baseGain.connect(this.masterGain);
        baseOsc.start();
        baseOsc.stop(this.ctx.currentTime + stepDuration);
      }

      this.bgmStep = (this.bgmStep + 1) % this.bgmSequence.length;
      this.bgmInterval = setTimeout(playNextStep, stepDuration * 1000);
    };

    // 再生開始
    this.bgmInterval = setTimeout(playNextStep, 0);
  }

  stopBGM() {
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.currentBgm = null;
  }
}

// グローバルに公開
window.AudioManager = new RetroAudioManager();
