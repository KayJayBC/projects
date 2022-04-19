//PeerJS documentation https://peerjs.com/docs/#api
var room_id;
var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
var local_stream;
var peer = null;
const idInput = document.getElementById("room-input");
const createBotton = document.getElementById("createbtn");
const joinBotton = document.getElementById("joinbtn");
const hangUpBotton = document.getElementById("closecall");


//Function to create the initial call. (Host of call creates and shares room ID/call key)
createBotton.onclick = () => {
    hangUpBotton.hidden = false;
    console.log("Creating Room")
    idInput.value = getRanHex();
    const code = idInput.value;
    //Checks for blank room id
    if (code == " " || code == "") {
        alert("Please enter room number")
        return;
    }
    room_id = code;
    peer = new Peer(room_id)
    peer.on('open', (id) => {
        console.log("Peer Connected with ID: ", id)
        hideModal()
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
        }, (err) => {
            console.log(err)
        })
        notify("Joining...")
    })
    peer.on('call', (call) => {
        call.answer(local_stream);
        call.on('stream', (stream) => {
            setRemoteStream(stream)
        })
        
    })

    alert("Copy and Share with your friend!: " + room_id);


}

//funtion that generates a random hex key of length 8 to be used for creating call
const getRanHex = () => {
    let result = [];
    let hexRef = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  
    for (let n = 0; n < 8; n++) {
      result.push(hexRef[Math.floor(Math.random() * 16)]);
    }
    return result.join('');
  }

function setLocalStream(stream) {

    let video = document.getElementById("local-video");
    video.srcObject = stream;
    video.muted = true;
    video.play();
}
function setRemoteStream(stream) {

    let video = document.getElementById("remote-video");
    video.srcObject = stream;
    video.play();
}

//Function to hide initial text box for calling
function hideModal() {
    document.getElementById("entry-modal").hidden = true
}

//Displays current status to user
function notify(msg) {
    let notification = document.getElementById("notification")
    notification.innerHTML = msg
    notification.hidden = false
    setTimeout(() => {
        notification.hidden = true;
    }, 3000)
}


//Button to connect the other user to the created call.  
joinBotton.onclick = () => {
    hangUpBotton.hidden = false;
    console.log("Joining Room")
    const code = idInput.value;
    if (code == " " || code == "") {
        alert("Please enter room number")
        return;
    }
    room_id = code;
    hideModal()
    peer = new Peer()
    peer.on('open', (id) => {
        console.log("Connected with Id: " + id)
        getUserMedia({ video: true, audio: true }, (stream) => {
            local_stream = stream;
            setLocalStream(local_stream)
            notify("Joining...")
            let call = peer.call(room_id, stream)
            call.on('stream', (stream) => {
                setRemoteStream(stream);
            })
        }, (err) => {
            console.log(err)
        })

    })
}

hangUpBotton.onclick = () => {
    peer.disconnect()
    peer.destroy()
    //window.close();
}