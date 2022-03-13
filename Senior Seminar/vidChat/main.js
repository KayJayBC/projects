
//import './style.css';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, getDoc, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.8/firebase-firestore.js';
//import { initializeApp } from "firebase/app";




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
const firebase = initializeApp(firebaseConfig);
const firestore = getFirestore();
/*if(!firebase.getApps.length){
  firebase.initializeApp(firebaseConfig);
}*/




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
const myCam = document.getElementById('localCam');
const theyCam = document.getElementById('remoteCam');
const startCam = document.getElementById('getMedia');
const callButton = document.getElementById('initCall');
const callInput = document.getElementById('callKey');
const endCall = document.getElementById('hangup');
const answerButton = document.getElementById('answer');

//Start your webcam and create and empty stream for visitor
startCam.onclick = async () => {
  localCam = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
  remoteCam = new MediaStream();

  localCam.getTracks().forEach((track) => {
    pc.addTrack(track, localCam);
  }); //This takes the local cam and pushes the data to the peer connection

  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {  //This listens for the remote cam from the peer connection
    remoteCam.addTrack(track);
  });
};

  myCam.srcObject = localCam;
  theyCam.srcObject = remoteCam;

  callButton.disabled = false;
  answerButton.disabled = false;
  startCam.disabled = true;

};

//Caller creates an offer/initializes call collections
callButton.onclick = async() => { 
  const callDB = doc(firestore, 'calls/test');
  const offerCandidates = doc(firestore, 'offerCandidates/candidates');
  const answerCandidates = doc(firestore, 'answerCandidates/candidates');

  //Gets potential ICE candidates (IP and port pair) to save to the database
  pc.onicecandidate = event => {
    event.candidate && setDoc(offerCandidates, event.candidate.toJSON());
  };

  //This creates the SDP object or Session Description Protocol
  const offerDescription = await pc.createOffer();
  //console.log(offerDescription);
  await pc.setLocalDescription(offerDescription);

  //Converting SDP object into a JSON object
  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  //Writing to firebase database
  setDoc(callDB, offer);

  callInput.value = callDB.id;


  //listens for changes in firestore; waiting for an answer to update peer connection
onSnapshot(callDB, (docSnapshot) => {
    const data = docSnapshot.data();
    if(!pc.currentRemoteDescription && data?.answer){
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
    };
  });

//Listens for answering user then adds them to the peer connection
const docRef = query(collection(firestore, 'answerCandidates'))
onSnapshot(docRef, (docSnapshot) => {
  docSnapshot.docChanges().forEach((doc) =>{
    if(doc.type === 'added') {
      const candidate = new RTCIceCandidate(doc.doc.data())
      pc.addIceCandidate(candidate);
    }
  })

})


 /* onSnapshot(doc(firestore, 'answerCandidates'), (docSnapshot) => {
      docSnapshot.docChanges().forEach((change) => { 
        if(change.type === 'added'){
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      })
      
  });
};*/


//This will answer a call based off of the ID created by firebase
answerButton.onclick = async () => {
  const callID = callInput.value;
  const callDoc = doc(firestore, 'calls/test');
  const answerCandidates = doc(firestore, 'answerCandidates/candidates');

  pc.onicecandidate = event => {
    event.candidate && setDoc(answerCandidates, event.candidate.toJSON());
  };

  const callData = (await getDoc(callDoc)).data();
  //console.log(callData.data());

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(offerDescription);

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change)
      if(change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });


};}