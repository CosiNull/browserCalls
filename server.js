const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
app.use(express.static("public"));

server.listen(4000);

let users = {};
let roomNums = 0;
let callRequests = {};

let availableUsers = () => {
  let result = [];
  for (let id in users) {
    if (!users[id].onCall) {
      result.push(users[id]);
    }
  }
  return result;
};
let lobbyHasChanged = () => {
  io.to("global").emit("update-online-users", availableUsers());
};

io.on("connection", (socket) => {
  socket.on("new-user", (userProfile) => {
    socket.join("global");
    users[userProfile.id] = userProfile;

    lobbyHasChanged();
    //console.log(users);
    socket.on("updateProfile", (profile) => {
      users[profile.id] = profile;
      lobbyHasChanged();
    });

    socket.on("disconnect", () => {
      //dont forget to delete callrequests that are pending
      delete users[userProfile.id];
      lobbyHasChanged();
    });
  });
  //Calls requesting
  socket.on("request-call", (rID, cID) => {
    socket.join(roomNums.toString());
    callRequests[rID] = {
      room: roomNums.toString(),
      calledID: cID,
      requesterID: rID,
    };
    socket
      .to("global")
      .emit("call-request-receiver", users[rID].name, cID, roomNums);
    roomNums++;
    console.log(callRequests);
  });
  socket.on("canceledCall", (rID) => {
    socket.join("global");
    delete callRequests[rID];
    console.log(callRequests);
  });
  socket.on("decline-caller", (cID) => {
    socket.join("global");
    for (let rID in callRequests) {
      if (callRequests[rID].calledID == cID) {
        console.log(callRequests[rID]);
        io.to(callRequests[rID].room).emit("my-call-declined", users[cID].name);
        break;
      }
    }
  });
  socket.on("call-accepted", (cID) => {
    for (let rID in callRequests) {
      if (callRequests[rID].calledID == cID) {
        socket.join(callRequests[rID].room);
        console.log("Start call!");
        //
        io.to(callRequests[rID].room).emit("start-call", callRequests[rID], {
          [rID]: users[rID].name,
          [cID]: users[cID].name,
        });
        return;
      }
    }
    //
    console.log("callerCanceled");
    socket.emit("caller-canceled-already", cID);
  });
});
