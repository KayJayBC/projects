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
let localCam = null;
let remoteCam = null;