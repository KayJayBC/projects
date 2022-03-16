//Faceapi official documentation: https://justadudewhohacks.github.io/face-api.js/docs/index.html
const video = document.getElementById('video')
const constraints = {
  audio: false,
  video: true
};

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(startVideo)

 async function startVideo() {
  try{
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleSuccess(stream);
  }catch(e){
    console.log('Error getting user media' + e);
  }
}

function handleSuccess(stream){
  window.stream = stream;
  video.srcObject = stream;
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
 setInterval(async () => {
  const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
  const resOptions = faceapi.resizeResults(detections, displaySize);
  

  canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
  faceapi.draw.drawDetections(canvas, resOptions);
 }, 100)
})