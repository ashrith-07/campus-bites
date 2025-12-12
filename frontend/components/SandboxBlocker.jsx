'use client';

import { useEffect, useState } from 'react';

export default function SandboxBlocker({ children }) {
const [isSandboxed, setIsSandboxed] = useState(false);

useEffect(() => {
try {
const sandbox = window.top !== window.self;
setIsSandboxed(sandbox);
} catch (e) {
setIsSandboxed(true); 
}
}, []);

if (isSandboxed) {
return (
<div
style={{
padding: '40px',
fontSize: '18px',
textAlign: 'center',
lineHeight: '1.6',
}}
>
Your browser has opened this page in a restricted view.<br />
Please click the **Open in Browser** option to continue. </div>
);
}

return children;
}
