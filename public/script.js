const socket = io("/");
let myPeer = new Peer();
myPeer.on("open", (id) => {
  myProfile.id = id;
  console.log(id);
});
let usersInLobby = [];
const myVideo = document.createElement("video");
myVideo.className = "video";
myVideo.muted = true;
//

let tellServerUpdateUser = (profile) => {
  socket.emit("updateProfile", profile);
};

let drawUsersOnline = () => {
  if (myProfile.name == undefined || myProfile.onCall) return;
  let currentUsers = document.querySelectorAll(".user");
  let currentBrUsers = document.querySelectorAll(".brUser");
  console.log(currentUsers);

  for (let icon of currentUsers) {
    icon.remove();
  }
  for (let icon of currentBrUsers) {
    icon.remove();
  }

  for (let user of usersInLobby) {
    let newUserBlock = document.createElement("div");
    newUserBlock.className = "user";
    newUserBlock.innerHTML = user.name;

    let callButton = document.createElement("BUTTON");
    callButton.className = "callButton";
    callButton.value = user.id;

    callButton.onclick = function () {
      //alert(2);
      callUser(user);
    };

    callButton.innerHTML = "CALL";

    newUserBlock.appendChild(callButton);

    document.body.appendChild(newUserBlock);

    let brEle = document.createElement("br");
    brEle.className = "brUser";
    document.body.appendChild(brEle);
  }
};

socket.on("update-online-users", (userList) => {
  usersInLobby = userList.filter((user) => user.id != myProfile.id);
  console.log(usersInLobby);
  drawUsersOnline();
});

let setLobby = () => {
  socket.emit("new-user", myProfile);
};

//Call requests----------Very long stuff
let callUser = (called) => {
  if (myProfile.onCall) return;
  myProfile.onCall = true;

  //setUp CallRequester
  document.getElementById("callRequester").style.display = "block";
  document.getElementById("callRequestName").innerHTML = `${called.name}`;

  //
  //Next--send call to server
  socket.emit("request-call", myProfile.id, called.id);

  tellServerUpdateUser(myProfile);
};

socket.on("call-request-receiver", (requesterName, requestedID, roomNum) => {
  if (myProfile.id == requestedID) {
    //alert(2);
    document.getElementById("callRequested").style.display = "block";
    document.getElementById("callerName").innerHTML = requesterName;
    document
      .getElementById("callerName")
      .appendChild(document.createElement("br"));
    myProfile.onCall = true;
    tellServerUpdateUser(myProfile);
  }
});

let cancelCall = () => {
  myProfile.onCall = false;
  socket.emit("canceledCall", myProfile.id);
  document.getElementById("callRequestName").innerHTML = "";
  document.getElementById("callRequester").style.display = "none";
  tellServerUpdateUser(myProfile);
};

let declineCaller = () => {
  myProfile.onCall = false;
  document.getElementById("callerName").innerHTML = "";
  socket.emit("decline-caller", myProfile.id);
  document.getElementById("callRequested").style.display = "none";
  tellServerUpdateUser(myProfile);
};

socket.on("my-call-declined", (nameOfDecliner) => {
  alert(`${nameOfDecliner} has declined your call`);
  cancelCall();
});

let acceptCaller = () => {
  socket.emit("call-accepted", myProfile.id);
};

socket.on("caller-canceled-already", (declinedID) => {
  if (myProfile.id == declinedID) {
    alert(
      `${
        document.getElementById("callerName").innerText
      } already canceled his call :(`
    );
    myProfile.onCall = false;
    document.getElementById("callerName").innerHTML = "";
    document.getElementById("callRequested").style.display = "none";
    tellServerUpdateUser(myProfile);
  }
});

//Call functions
socket.on("start-call", (callRequestDes, names) => {
  console.log(callRequestDes);
  console.log(names);
  console.log("Call!");

  //delete elements
  if (myProfile.id == callRequestDes.calledID) {
    document.getElementById("callerName").innerHTML = "";
    document.getElementById("callRequested").style.display = "none";
  } else if (myProfile.id == callRequestDes.requesterID) {
    document.getElementById("callRequestName").innerHTML = "";
    document.getElementById("callRequester").style.display = "none";
  } else {
    console.error("Uh oh");
  }
  //delete other elements
  document.getElementById("profile").style.display = "none";
  document.getElementById("availables").style.display = "none";

  let currentUsers = document.querySelectorAll(".user");
  let currentBrUsers = document.querySelectorAll(".brUser");
  console.log(currentUsers);

  for (let icon of currentUsers) {
    icon.remove();
  }
  for (let icon of currentBrUsers) {
    icon.remove();
  }

  //Appear some elements
  document.getElementById("myVidSection").style.display = "block";
  document.getElementById("otherGuyVidSection").style.display = "block";
  //Call! Call!

  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      //Me
      myVideo.srcObject = stream;
      myVideo.addEventListener("loadedmetadata", () => {
        myVideo.play();
      });
      document.getElementById("myVidSection").append(myVideo);
      //Name tag
      let myNameTag = document.createElement("div");
      myNameTag.innerText = names[myProfile.id];
      myNameTag.className = "nameTag";
      document.getElementById("myVidSection").append(myNameTag);

      //Other guy
      //if (myProfile.id == callRequestDes.calledID) {
      let calling =
        myProfile.id == callRequestDes.calledID
          ? callRequestDes.requesterID
          : callRequestDes.calledID;
      const call = myPeer.call(calling, stream);
      const receivedVideo = document.createElement("video");
      receivedVideo.className = "video";
      call.on("stream", (streamReceived) => {
        document.getElementById("otherGuyVidSection").innerHTML = "";
        receivedVideo.srcObject = streamReceived;
        receivedVideo.addEventListener("loadedmetadata", () => {
          receivedVideo.play();
        });
        document.getElementById("otherGuyVidSection").append(receivedVideo);
        //Name tag
        console.log("hey2");
        let hisNameTag = document.createElement("div");
        hisNameTag.innerText =
          myProfile.id == callRequestDes.calledID
            ? names[callRequestDes.requesterID]
            : names[callRequestDes.calledID];
        hisNameTag.className = "nameTag";
        document.getElementById("otherGuyVidSection").append(hisNameTag);
      });
      call.on("close", () => {
        alert(2);
      }); /*
      } else if (myProfile.id == callRequestDes.requesterID) {
       
        const call = myPeer.call(callRequestDes.calledID, stream);
        const receivedVideo = document.createElement("video");
        receivedVideo.className = "video";
        call.on("stream", (streamReceived) => {
          document.getElementById("otherGuyVidSection").innerHTML = "";
          receivedVideo.srcObject = streamReceived;
          receivedVideo.addEventListener("loadedmetadata", () => {
            receivedVideo.play();
          });
          document.getElementById("otherGuyVidSection").append(receivedVideo);

          //Name tag
          console.log("hey");
          let hisNameTag = document.createElement("div");
          hisNameTag.innerText =
            myProfile.id == callRequestDes.calledID
              ? names[callRequestDes.requesterID]
              : names[callRequestDes.calledID];
          hisNameTag.className = "nameTag";
          document.getElementById("otherGuyVidSection").append(hisNameTag);
        });
        call.on("close", () => {
          alert(2);
        });
       
      } */
      myPeer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (streamReceived) => {
          const receivedVideo = document.createElement("video");
          document.getElementById("otherGuyVidSection").innerHTML = "";
          receivedVideo.srcObject = streamReceived;
          receivedVideo.addEventListener("loadedmetadata", () => {
            receivedVideo.play();
          });
          document.getElementById("otherGuyVidSection").append(receivedVideo);

          //Name tag
          console.log("hey");
          let hisNameTag = document.createElement("div");
          hisNameTag.innerText =
            myProfile.id == callRequestDes.calledID
              ? names[callRequestDes.requesterID]
              : names[callRequestDes.calledID];
          hisNameTag.className = "nameTag";
          document.getElementById("otherGuyVidSection").append(hisNameTag);
        });
        call.on("close", () => {
          alert("disconnection");
        });
      });
    });
});

/*
  var video = document.querySelector("#videoElement");
  video.muted = true;
  video.style.display = "block";

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then(function (stream) {
        video.srcObject = stream;
      })
      .catch(function (err0r) {
        console.log("Something went wrong!");
      });
  }
  */
