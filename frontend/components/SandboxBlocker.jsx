'use client';

import { useEffect, useState } from 'react';

export default function SandboxBlocker({ children }) {
const [sandboxState, setSandboxState] = useState("checking");
// checking | sandboxed | clean

useEffect(() => {
try {
const sandbox = window.top !== window.self;
setSandboxState(sandbox ? "sandboxed" : "clean");
} catch (e) {
setSandboxState("sandboxed");
}
}, []);

// ⛔ Prevent ALL other code from running until we know
if (sandboxState === "checking") return null;

if (sandboxState === "sandboxed") {
return (
<div
style={{
padding: '40px',
fontSize: '18px',
textAlign: 'center',
lineHeight: '1.6',
}}
>
Your browser opened this page in a restricted (sandboxed) view. <br />
Please tap **Open in Browser** to continue. </div>
);
}

// safe → render app
return children;
}
