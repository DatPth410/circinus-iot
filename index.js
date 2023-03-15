const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const { google } = require("googleapis");
const qs = require("qs");
const { default: axios } = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const getAcceToken = async () => {
  var data = qs.stringify({
    client_id:
      "666562573651-2s060oprrfpkjde2m98q7ba6f7ces143.apps.googleusercontent.com",
    client_secret: "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",
    refresh_token:
      "1//09DndJN_mC5mACgYIARAAGAkSNwF-L9Ir3v-dWjD0PocTzNFPjw6xh06a-gEGVQyirUtXajmTBSYvwPpAq_CFSODAaObJj716YIg",
    grant_type: "refresh_token",
  });
  var config = {
    method: "post",
    url: "https://accounts.google.com/o/oauth2/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: data,
  };

  let accessToken = "";

  await axios(config)
    .then(async function (response) {
      accessToken = await response.data.access_token;

      //   console.log("Access Token " + accessToken);
    })
    .catch(function (error) {
      console.log(error);
    });

  return accessToken;
};

const generateConfig = (url, accessToken) => {
  return {
    method: "get",
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      "Content-type": "application/json",
    },
  };
};

const gmailCall = async (url) => {
  try {
    // const { token } = await oAuth2Client.getAccessToken();
    const token = await getAcceToken();

    const configAPI = generateConfig(url, token);
    const response = await axios(configAPI);
    return response.data;
  } catch (error) {
    return error;
  }
};

const getAllMail = async () => {
  const url = `https://gmail.googleapis.com/gmail/v1/users/datbkvanhungnguoiem@gmail.com/messages`;
  return gmailCall(url);
};

const readMail = async (id) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/datbkvanhungnguoiem@gmail.com/messages/${id}`;
    return gmailCall(url);
  } catch (error) {
    console.log(error);
    return error;
  }
};
let lastId = "";
let change = false;

io.on("connection", async (socket) => {
  const intervalId = setInterval(async () => {
    const mails = await getAllMail();
    const currentLastId = mails.messages[0].id;
    if (currentLastId !== lastId) {
      if (lastId !== "") {
        const mail = await readMail(currentLastId);
        console.log("===============");
        console.log(mail.snippet);
        console.log(mails.messages[0]);

        if (mail.snippet.includes("circinus:")) {
          socket.emit("message", mail.snippet);
        }
      }

      lastId = currentLastId;
    }
  }, 1000);
  console.log("A user has connected.");

  socket.on("disconnect", () => {
    console.log("A user has disconnected.");
  });

  if (change) {
    change = false;
  }
});

server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});

// console.log("hello");
