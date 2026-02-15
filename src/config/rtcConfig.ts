const turnUsername = import.meta.env.VITE_TURN_USERNAME
const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL

const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: ['stun:stun.relay.metered.ca:80', 'stun:stun.relay.metered.ca:443'],
    },
    ...(turnUsername && turnCredential
      ? [
          {
            urls: [
              'turn:eu.relay.metered.ca:80',
              'turn:eu.relay.metered.ca:443',
              'turn:eu.relay.metered.ca:443?transport=tcp',
            ],
            username: turnUsername,
            credential: turnCredential,
          },
        ]
      : []),
  ],
}

export default configuration
