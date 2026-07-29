// The cross-network Collaboration 2.0 walkthrough. Faithful to the extension's
// actual behaviour — the wording below deliberately preserves the facts that
// matter for security expectations:
//   - the invite link is NEVER enough on its own,
//   - a wrong code burns itself immediately (no retry on the same code),
//   - exhausting the attempts kills the request: a NEW LINK is needed, not
//     just another code,
//   - CodeXR shows each participant's IP but does NOT block IPs (no denylist),
//   - removing a LOCAL participant does not keep them out; stopping the server
//     does,
//   - cross-network is ON by default as of the 2026-07-30 README (it opens with
//     the analysis server, the link lives as long as the share, and the
//     30-minute expiry is gone). It used to be opt-in, and five places on this
//     site said so; do not reintroduce that claim. It is still switchable off
//     in Server Configuration, and a headset on your own wifi needs none of it.
// `file` paths are relative to public/assets/releases/v1-2-0. `w`/`h` are the
// files' real pixel sizes: they reserve the box before load (no CLS) and cap
// how far a capture may grow, since these are flat 1x/2x screenshots and
// upscaling past their own pixels only blurs them.
export const collaboration = {
  eyebrow: 'Collaboration',
  heading: 'Cross-network Collaboration 2.0',
  intro:
    'CodeXR can share an XR session with someone who is not on your network, through an outbound Cloudflare tunnel. There are two roles, and they never blur: the host runs the analysis in VS Code and owns the session; the guest joins from a browser, anywhere.',

  principle: {
    title: 'The link is never enough',
    body:
      'Whoever opens the invitation link still has to receive a six-digit code from the host, over a separate channel the two of you trust. Anyone who intercepts the link alone stays in the waiting room.',
  },

  roles: {
    host: 'Host',
    guest: 'Guest',
    both: 'Both',
  },

  steps: [
    {
      id: 'share',
      role: 'host',
      title: 'Start the server, the tunnel follows',
      body: [
        'Cross-network connections are on by default, so the tunnel opens together with your analysis server. The first time, CodeXR offers to download cloudflared once and remembers your answer. If you stopped the connection, "Start remote access" on the server row brings it back.',
        'The tunnel is outbound: your router accepts no incoming connections and your IP is never published. The sidebar shows the cross-network address, an https://…trycloudflare.com/join link that also lands on your clipboard, ready to send to your guest through any channel you like. It stays valid for as long as you keep sharing.',
      ],
      images: [
        { file: 'collaboration/host_user/control_panel.png', w: 643, h: 528, alt: 'The server panel with cross-network enabled and the trycloudflare address ready to share' },
      ],
    },
    {
      id: 'identity',
      role: 'guest',
      title: 'Pick an identity and request access',
      body: [
        'Opening the link lands on the "Join the XR session" page. The guest continues as anonymous (CodeXR reserves an alias) or chooses a custom name between 2 and 32 characters.',
        'Pressing "Request access" puts them in the waiting room: the page now shows a six-digit field and a Connect button, and without a code nobody gets past it.',
      ],
      images: [
        { file: 'collaboration/invited_user/remote-join-identity.png', w: 920, h: 1256, alt: 'The join page: continue as anonymous with a reserved alias, or choose a custom display name' },
      ],
    },
    {
      id: 'code',
      role: 'host',
      title: 'Hand over the code',
      body: [
        'VS Code notifies you: "Remote request from <name>. Temporary code: <six digits>", with a Copy code button. The sidebar shows "Shared · 1 request waiting" and a "Generate new pairing code" action of its own, so dismissing the notification never blocks anything.',
        'Read or send those six digits to your guest over another channel: a call, a message.',
      ],
      images: [
        { file: 'collaboration/host_user/user_code.png', w: 456, h: 93, alt: 'The VS Code notification with the temporary six-digit code and its Copy code button' },
        { file: 'collaboration/host_user/waiting_invited_user.png', w: 352, h: 140, alt: 'The sidebar while a request waits: Shared, one request waiting, and Generate new pairing code' },
      ],
    },
    {
      id: 'connect',
      role: 'guest',
      title: 'Type it and enter',
      body: [
        'The guest types the six digits and presses Connect. If they match, they are in the session.',
      ],
      images: [
        { file: 'collaboration/invited_user/remote-join-code.png', w: 920, h: 800, alt: 'The six-digit pairing field and the Connect button, waiting for the code the host reads out' },
      ],
    },
    {
      id: 'burnt',
      role: 'both',
      title: 'When a code fails',
      body: [
        'A wrong code burns itself on the server immediately: it cannot be retried. The host gets a notice with the guest’s name and address and a "Generate new code" button that issues another instantly, as many times as needed. The guest sees "The code is not valid." and an empty field.',
        'If the guest runs out of attempts, the request itself dies: they need a new invitation link, not just another code. An expired or already-used link shows "Invitation unavailable".',
      ],
      images: [
        { file: 'collaboration/invited_user/remote-join-rejected.png', w: 920, h: 844, alt: 'The join page rejecting a code: the field is cleared and the code is burnt' },
        { file: 'collaboration/invited_user/remote-join-expired.png', w: 920, h: 536, alt: 'A dead invitation: expired or already used, so a new link is needed' },
      ],
    },
    {
      id: 'control',
      role: 'host',
      title: 'Run the room',
      body: [
        '"Connected users" lists everyone, each row with their avatar colour, client (CodeXR or Browser) and scope (Local or Remote). Clicking a person opens their card: name, role, avatar, connection time, scope and IP address.',
        'Guests carry a "Remove from Session" action; the host cannot be removed. Removing a remote guest revokes their session: their link stops working, and coming back takes a new invitation and a new code. Removing someone on the local network does not stop them reopening the server address; for that, stop the server. CodeXR shows each IP but does not block IPs: there is no denylist.',
        '"Stop remote connection" revokes invitations, sessions and credentials in one go, and the trycloudflare address stops existing.',
      ],
      images: [
        { file: 'collaboration/host_user/control_host_users.png', w: 266, h: 75, alt: 'Connected users: one local CodeXR participant and one remote browser guest, each with their colour' },
      ],
    },
  ],

  notesTitle: 'The fine print',
  notes: [
    'The tunnel is a Cloudflare Quick Tunnel: free, no account, and explicitly best effort. No SLA, no Server-Sent Events, and the address changes every time.',
    'cloudflared is pinned to version 2026.5.2, downloaded only with your explicit consent, and verified by SHA-256 before it ever runs.',
    'None of this is needed for VR on your own network: a headset on the same wifi opens the scene directly. Cross-network is on by default, and turning it off in Server Configuration stops every tunnel and deletes the cloudflared copy CodeXR downloaded.',
  ],

  lightbox: {
    expand: 'Expand screenshot',
    close: 'Close expanded screenshot',
  },

  carousel: {
    previousStep: 'Previous step',
    nextStep: 'Next step',
    goToStep: (n, title) => `Go to step ${n}: ${title}`,
    stepAbbr: 'Step',
  },
};
