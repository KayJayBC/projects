//Faceapi official documentation: https://justadudewhohacks.github.io/face-api.js/docs/index.html
const video = document.getElementById('video')
const submitButton = document.getElementById('submit')
const input = document.getElementById('name')
const startButton = document.getElementById('start')
const constraints = {
  audio: false,
  video: true
};

let text = 'null/unknown'
submitButton.onclick = async () => {
 text = input.value
}

startButton.onclick = async() => {
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
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
  const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors() //new faceapi.TinyFaceDetectorOptions())
  const resOptions = faceapi.resizeResults(detections, displaySize);

  
  const anchor = {x: video.width, y: video.height-45}
  const drawOptions = {
    anchorPosition: 'TOP_LEFT'
  }
  
  const onBox = new faceapi.draw.DrawTextField(text, anchor, drawOptions)
  
  canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
  
  //faceapi.draw.drawDetections(canvas, resOptions);
  resOptions.forEach(detection =>{
    const box = detection.detection.box;
    const drawBox = new faceapi.draw.DrawBox(box, {label: 'Face'})
    drawBox.draw(canvas);
  })
  //onBox.draw(canvas)

 }, 100)
})}


async function confirmUser(){
  let answer = confirm('Are you speaking with your intended person?\n Okay for Yes\n Cancel for No')

  if (answer == false){
    let newName = prompt('What is their name');
    text = newName;
  }else{
    
  }
}

function intervalConfirm(){
  let intervalID = setInterval(confirmUser, 10000)
}

intervalConfirm()