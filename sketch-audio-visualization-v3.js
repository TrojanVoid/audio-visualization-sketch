const canvasSketch = require('canvas-sketch');
const math = require('canvas-sketch-util/math');
const eases = require('eases');
const random = require('canvas-sketch-util/random');
const colormap = require('colormap');

const body = document.getElementsByTagName("body")[0];
body.style.backgroundColor = 'black';


const settings = {
  dimensions: [ 1080, 1080 ],
  animate: true,
};

let audio;
let audioContext, audioData, sourceNode, analyserNode;
let manager;
let minDb, maxDb;



const sketch = () => {
  const numCircles = 6;
  const radius = 200;
  const rotateSpeed = 0.0025;
  let rotateAmount = rotateSpeed;
  
  const lineWidths = [];
  let lineWidth;
  
  const bins = [];
  const startAngles = [];

  for(let i = 0; i < numCircles; i++){
    //bin creation
    bins.push(16*i);

    //exponential line width creation
    const t = i / (numCircles - 1);
    lineWidth = eases.quadIn(t) * 100 + 20;
    lineWidths.push(lineWidth);

    //random start angles creation
    startAngles.push(math.degToRad(random.rangeFloor(0,270)));
  }

  //create the colors array
  const colors = colormap({
    colormap : 'cubehelix ',
    nshades : 360,
  })

  return ({ context, width, height }) => {
    context.fillStyle = 'rgb(240,240,240)';
    context.roundRect(0, 0, width, height,100);
    context.fill();

    if(!audioContext) return;

    analyserNode.getFloatFrequencyData(audioData);
    analyserNode.smoothingTimeConstant = 0.975;

    context.save();
    context.translate(width * 0.5, height * 0.5);
    
    let cradius = radius;
    let bin;
    let colorIndex;
    
    for (let i = 0; i < numCircles; i++){
        bin = bins[i];        
        lineWidth = lineWidths[i];
        
        mappedAngle = (math.mapRange(audioData[bin], minDb, maxDb, -60,360,true))+90;
        if(mappedAngle > 360) mappedAngle = 360;
        mappedAngle = math.degToRad(mappedAngle);
        
        randomAngle = math.degToRad(random.rangeFloor(0,360));
        
        colorIndex = math.mapRange(Math.abs(getAverage(audioData, i*8+20)),Math.abs(maxDb),Math.abs(minDb),0,colors.length,true);

        context.strokeStyle = colors[Math.floor(colorIndex)];
        context.lineWidth = lineWidth;
        context.beginPath();
        context.arc(0,0, cradius + (context.lineWidth*0.5), startAngles[i] + rotateAmount, mappedAngle + startAngles[i] + rotateAmount);
        context.stroke();
        cradius += lineWidth;
    }
    rotateAmount += rotateSpeed
      


    context.restore();
    
  };
};

const addListeners = () => {
  window.addEventListener('mouseup', () => {
    if(!audioContext) createAudio();
    if (audio.paused) {
      audio.play();
      manager.play();
    }
    else {
      audio.pause();
      manager.pause();
    }
  })
}

const createAudio = () => {
  audio = document.createElement('audio');
  audio.src = 'audio/metamorphosis.mp3';
  
  audioContext = new AudioContext();
  
  sourceNode = audioContext.createMediaElementSource(audio);
  sourceNode.connect(audioContext.destination);

  analyserNode = audioContext.createAnalyser();
  sourceNode.connect(analyserNode);
  minDb = analyserNode.minDecibels;
  maxDb = analyserNode.maxDecibels;

  audioData = new Float32Array(analyserNode.frequencyBinCount);
}

const getAverage = (data, length) => {
  let sum = 0;
  for(let i = 0; i < length; i++){
    sum += data[i];
  }
  return sum / length;
}

const start = async () => {
  addListeners();
  manager = await canvasSketch(sketch, settings);
  manager.pause();
}


start();
const canvas = document.getElementsByTagName("canvas")[0];
canvas.style.borderRadius = '25%';