'use strict';

class ClientError extends Error {
}

class ServerError extends Error {
}

const sendClientError = (res, message) => {
  res.status(400).send({error: message});
};

const sendServerError = (res, message, err) => {
  console.error(message, err);
  res.status(500).send({error: message});
};

module.exports = {
  ClientError: ClientError,
  ServerError: ServerError,
  sendClientError: sendClientError,
  sendServerError: sendServerError
};
