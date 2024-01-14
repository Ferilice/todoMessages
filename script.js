const hasuraEndpoint = "https://winning-cod-59.hasura.app/v1/graphql";
const apiKey =
  "nXjJBhKiruREqLnGXNHmKTUfLiuDBN7iyFVaszMNvLx1WuDh699Dz7YoZxYNfBwo";

const headers = {
  "Content-Type": "application/json",
  "x-hasura-admin-secret": apiKey,
};

let notification = true;
let newArr = [];
let cout = 0;
let CoutN = document.getElementById("c");
const graphqlQuery = `
        query MyQuery {
            users {
                id
                message
                name
            }
        }
        `;
axios
  .post(hasuraEndpoint, { query: graphqlQuery }, { headers: headers })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });

function showMessageOnUI(name, message) {
  var listItem = document.createElement("li");
  var userDiv = document.createElement("div");
  userDiv.className = "userInfoPublic";
  userDiv.innerText = `@${name}`;
  var displayedName = document.getElementById("displayedName");
  displayedName.innerText = name;
  var messageDiv = document.createElement("div");
  messageDiv.className = "labelContent";
  messageDiv.innerText = message;
  listItem.appendChild(userDiv);
  listItem.appendChild(messageDiv);
  var firstMessage = document.getElementById("messageList").firstChild;
  document.getElementById("messageList").insertBefore(listItem, firstMessage);
}

function fetchAndShowData() {
  const graphqlQuery = `
        query MyQuery {
            users {
                id
                message
                name
            }
        }
        `;
  axios
    .post(hasuraEndpoint, { query: graphqlQuery }, { headers: headers })
    .then((response) => {
      if (!notification && newArr.length > 0) {
        document.getElementById("notificationDiv").style.display = "none";
        for (const item of newArr) {
          showMessageOnUI(item.name, item.message);
        }
      }
      console.log(response.data);
      const messages = response.data.data.users;
      for (const message of messages) {
        showMessageOnUI(message.name, message.message);
      }
      if (messages.length > 0) {
        var latestMessage = messages[messages.length - 1];
        document.getElementById("nameInput").value = latestMessage.name;
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
function setupSubscription() {
  const graphqlSubscription = `
        subscription MySubscription {
            users {
                id
                name
                message
            }
        }
        `;
  const ws = new WebSocket(`wss://winning-cod-59.hasura.app/v1/graphql`);
  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "connection_init",
        payload: {
          headers: {
            "x-hasura-admin-secret": apiKey,
          },
        },
      })
    );

    ws.send(
      JSON.stringify({
        type: "start",
        id: "1",
        payload: {
          query: graphqlSubscription,
        },
      })
    );
  };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "data") {
      const message = data.payload.data.users;
      showMessageOnUI(message.name, message.message);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket closed.");
  };
}

document.addEventListener("DOMContentLoaded", function () {
  fetchAndShowData();
  setupSubscription();
});

function sendMessageToBackend(message) {
  var userInput = document.getElementById("nameInput").value;
  if (userInput.trim() === "") {
    alert("Name cannot be empty.");
    return;
  }
  axios
    .post(
      hasuraEndpoint,
      {
        query: `
                mutation InsertMessage($message: String!, $name: String!) {
                    insert_users(objects: { name: $name, message: $message }) {
                        returning {
                            id
                            name
                            message
                        }
                    }
                }`,
        variables: { message: message, name: userInput },
      },
      { headers: headers }
    )
    .then((response) => {
      const insertedMessage = response.data.data.insert_users.returning[0];
      notification = false;
      cout++;
      CoutN.textContent = cout;
      if (!notification) {
        document.getElementById("notificationDiv").style.display = "block";
      }
      newArr.push({
        name: insertedMessage.name,
        message: insertedMessage.message,
      });
    })
    .catch((error) => {
      console.error(error);
    });
}

function showMessage() {
  var userInput = document.getElementById("messageInput").value;
  if (userInput.trim() === "") {
    return;
  }
  sendMessageToBackend(userInput);
  document.getElementById("messageInput").value = "";
}

function sendMessage() {
  showMessage();
}
function showDataFromArr() {
  if (newArr.length > 0) {
    for (const item of newArr) {
      showMessageOnUI(item.name, item.message);
    }
    newArr.splice(0, newArr.length);
  }
  document.getElementById("notificationDiv").style.display = "none";
}
