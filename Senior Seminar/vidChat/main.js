import './style.css'
import firebase from 'firebase/app';
import 'firebase/firestore';

//Configuration of firebase app via firestore
const firebaseConfig = {
  apiKey: "AIzaSyD-p60MLAsa5KmJhUXJPmhFyhejpUJ2xhQ",
  authDomain: "seminarkjb.firebaseapp.com",
  databaseURL: "https://seminarkjb-default-rtdb.firebaseio.com",
  projectId: "seminarkjb",
  storageBucket: "seminarkjb.appspot.com",
  messagingSenderId: "378503072325",
  appId: "1:378503072325:web:441459fd6b3831c2bef12c"
};

//Initializing the firebase app
if(!firebase.getApps.length){
  firebase.initializeApp(firebaseConfig);
}

const firestore = firebase.firestore();


//The list of public STUN Servers to use for connections
//I used a few hosted by google but a long list is available here {https://ourcodeworld.com/articles/read/1536/list-of-free-functional-public-stun-servers-2021}
const servers = {
  iceList: [
    {
      urls: ['stun1.l.google.com:19302', 'stun2.l.google.com:19302', 'stun3.l.google.com:19302','stun4.l.google.com:19302'],
    },
  ],
 iceCandidatePoolSize: 10,
};

//This is the object resposible for the P2P connection work
let pc = new RTCPeerConnection(servers);

//Objects of each webcam in the chat
let localCam = null;
let remoteCam = null;

//Importing HTML Elements
const myCam = document.getElementsById('localCam');
const theyCam = document.getElementsById('remoteCam');
const startCam = document.getElementsById('getMedia');
const callButton = document.getElementsById('initCall');
const callInput = document.getElementsById('callKey');
const endCall = document.getElementsById('hangup');
const answerButton = document.getElementById('answer');

//Start your webcam and create and empty stream for visitor
startCam.onclick = async () => {
  localCam = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
  remoteCam = new MediaStream();

  localCam.getTracks().forEach((track) => {pc.addTrack(track, localCam)}); //This takes the local cam and pushes the data to the peer connection

  pc.ontrack = event => {event.streams[0].getTracks().forEach(track => {  //This listens for the remote cam from the peer connection
    remoteCam.addTrack(track);
  });
};

  myCam.srcObject = localCam;
  theyCam.srcObject = remoteCam;

};

//Caller creates an offer/initializes call collections
callButton.onclick = async() => {
  const callDB = firestore.collection('calls').doc();
  const offerCandidates = callDB.collection('offerCandidates');
  const answerCandidates = callDB.collection('answerCandidates');


  callInput.value = callDB.id; //This fills the text box with the random ID created via Firestore

  //Gets potential ICE candidates (IP and port pair) to save to the database
  pc.onicecandidate = event => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  //This creates the SDP object or Session Description Protocol
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  //Converting SDP object into a JSON object
  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,

  };

  //Writing to firebass database
  await callDB.set({offer});


  //listens for changes in firestore; waiting for an answer to update peer connection
  callDB.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if(!pc.currentRemoteDescription && data?.answer){
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
    }
  })

  //Listens for answering user then adds them to the peer connection
  answerCandidates.onSnapshot(snapshot => {
    snapshot.docChanges().forEach((change) => {
      if(change.type === 'added'){
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });

  });
};


//This will answer a call based off of the ID created by firebase
answerButton.onclick = async () => {
  const callID = callInput.value;
  const callDB = firestore.collection('calls').doc(callID);
  const answerCandidates = callDB.collection('answerCandidates');

  pc.onicecandidate = event => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());

  };

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription))

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,

  };

  await callDB.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change)
      if(change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });


};