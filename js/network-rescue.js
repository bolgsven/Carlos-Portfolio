(function () {
  "use strict";

  const root = document.getElementById("network-rescue");
  if (!root) return;

  const incidents = [
    {
      title: "Websites are not loading",
      description: "A user reports that Wi-Fi is connected, but websites will not open.",
      device: "WS-BIC-014",
      status: "Connected · User affected",
      diagnostics: {
        ipconfig:
`> ipconfig /all

IPv4 Address . . . . . . . . . : 192.168.10.24
Subnet Mask  . . . . . . . . . : 255.255.255.0
Default Gateway  . . . . . . . : 192.168.10.1
DNS Servers . . . . . . . . . : 192.168.10.53`,
        gateway:
`> ping 192.168.10.1

Reply from 192.168.10.1: bytes=32 time<1ms TTL=64
Reply from 192.168.10.1: bytes=32 time<1ms TTL=64

Gateway connectivity: OK`,
        internet:
`> ping 8.8.8.8

Reply from 8.8.8.8: bytes=32 time=18ms TTL=117
Reply from 8.8.8.8: bytes=32 time=17ms TTL=117

Internet connectivity: OK`,
        nslookup:
`> nslookup example.com

Server:  192.168.10.53
DNS request timed out.
DNS request timed out.

Name resolution: FAILED`
      },
      options: [
        ["dns", "DNS configuration / DNS server failure"],
        ["router", "Router hardware failure"],
        ["cable", "Ethernet cable disconnected"],
        ["conflict", "Duplicate IP address"]
      ],
      answer: "dns",
      success: "Correct. The host can reach the gateway and the internet by IP, but name resolution fails. DNS is the fault. Fix applied: working DNS settings restored."
    },
    {
      title: "Local network works, internet does not",
      description: "The workstation can reach devices on its local subnet, but cannot reach external networks.",
      device: "WS-BIC-022",
      status: "LAN reachable · Internet unavailable",
      diagnostics: {
        ipconfig:
`> ipconfig /all

IPv4 Address . . . . . . . . . : 192.168.20.44
Subnet Mask  . . . . . . . . . : 255.255.255.0
Default Gateway  . . . . . . . : 192.168.21.1
DNS Servers . . . . . . . . . : 1.1.1.1`,
        gateway:
`> ping 192.168.21.1

Reply from 192.168.20.44:
Destination host unreachable.

Gateway connectivity: FAILED`,
        internet:
`> ping 8.8.8.8

Reply from 192.168.20.44:
Destination host unreachable.

External connectivity: FAILED`,
        nslookup:
`> nslookup example.com

DNS request timed out.
No route to external DNS service.`
      },
      options: [
        ["gateway", "Incorrect default gateway"],
        ["dns", "DNS server issue"],
        ["browser", "Browser cache problem"],
        ["switch", "Switch port disabled"]
      ],
      answer: "gateway",
      success: "Correct. The configured gateway is outside the workstation's /24 subnet. Fix applied: default gateway changed to 192.168.20.1."
    },
    {
      title: "New workstation cannot reach the network",
      description: "A recently connected PC shows network access problems and has no usable route off the local link.",
      device: "WS-BIC-031",
      status: "Limited connectivity · New device",
      diagnostics: {
        ipconfig:
`> ipconfig /all

DHCP Enabled . . . . . . . . . : Yes
IPv4 Address . . . . . . . . . : 169.254.83.17
Subnet Mask  . . . . . . . . . : 255.255.0.0
Default Gateway  . . . . . . . :`,
        gateway:
`> ping gateway

No default gateway is configured.

Gateway connectivity: NOT AVAILABLE`,
        internet:
`> ping 8.8.8.8

PING: transmit failed.
General failure.

External connectivity: FAILED`,
        nslookup:
`> nslookup example.com

DNS request timed out.
No DNS server is configured.`
      },
      options: [
        ["dhcp", "DHCP lease failure / APIPA address"],
        ["qos", "Quality of Service issue"],
        ["firewall", "Firewall blocking HTTPS"],
        ["hostname", "Duplicate computer name"]
      ],
      answer: "dhcp",
      success: "Correct. A 169.254.x.x address is APIPA, indicating the client did not obtain a DHCP lease. Fix applied: DHCP connectivity restored and a valid lease obtained."
    }
  ];

  const incidentNumber = root.querySelector("#nr-incident-number");
  const incidentTitle = root.querySelector("#nr-incident-title");
  const incidentDescription = root.querySelector("#nr-incident-description");
  const deviceName = root.querySelector("#nr-device-name");
  const deviceStatus = root.querySelector("#nr-device-status");
  const terminal = root.querySelector("#nr-terminal-output");
  const optionsWrap = root.querySelector("#nr-diagnosis-options");
  const applyButton = root.querySelector("#nr-apply-fix");
  const nextButton = root.querySelector("#nr-next");
  const restartButton = root.querySelector("#nr-restart");
  const feedback = root.querySelector("#nr-feedback");
  const completePanel = root.querySelector("#nr-complete");
  const scoreValue = root.querySelector("#nr-score-value");
  const diagnosisPanel = root.querySelector(".nr-diagnosis-panel");
  const progressDots = Array.from(root.querySelectorAll(".nr-progress-dot"));
  const commandButtons = Array.from(root.querySelectorAll(".nr-command"));

  let current = 0;
  let usedCommands = new Set();
  let totalCommands = 0;
  let wrongAttempts = 0;
  let resolved = false;

  function setProgress() {
    progressDots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === current && current < incidents.length);
      dot.classList.toggle("is-complete", index < current || current >= incidents.length);
    });
  }

  function renderOptions(incident) {
    optionsWrap.innerHTML = "";
    incident.options.forEach(([value, label], index) => {
      const wrap = document.createElement("div");
      wrap.className = "nr-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "network-diagnosis";
      input.id = `nr-option-${current}-${index}`;
      input.value = value;

      const text = document.createElement("label");
      text.htmlFor = input.id;
      text.textContent = label;

      input.addEventListener("change", updateApplyState);

      wrap.append(input, text);
      optionsWrap.appendChild(wrap);
    });
  }

  function updateApplyState() {
    const selected = optionsWrap.querySelector('input[name="network-diagnosis"]:checked');
    applyButton.disabled = usedCommands.size < 2 || !selected || resolved;
  }

  function loadIncident(index) {
    const incident = incidents[index];
    current = index;
    usedCommands = new Set();
    resolved = false;

    incidentNumber.textContent = `INCIDENT ${String(index + 1).padStart(2, "0")} / 03`;
    incidentTitle.textContent = incident.title;
    incidentDescription.textContent = incident.description;
    deviceName.textContent = incident.device;
    deviceStatus.textContent = incident.status;

    terminal.textContent = "> Incident loaded.\n> Select a diagnostic command below.";
    feedback.textContent = "";
    feedback.className = "nr-feedback";

    commandButtons.forEach((button) => {
      button.disabled = false;
      button.classList.remove("is-used");
    });

    renderOptions(incident);

    applyButton.hidden = false;
    applyButton.disabled = true;
    nextButton.hidden = true;
    restartButton.hidden = true;
    diagnosisPanel.hidden = false;
    completePanel.hidden = true;

    setProgress();
  }

  function runCommand(command, button) {
    if (resolved) return;

    const incident = incidents[current];
    const output = incident.diagnostics[command];
    if (!output) return;

    if (!usedCommands.has(command)) {
      usedCommands.add(command);
      totalCommands += 1;
    }

    button.classList.add("is-used");

    terminal.textContent += `\n\n${output}`;
    terminal.scrollTop = terminal.scrollHeight;

    updateApplyState();
  }

  function applyFix() {
    const selected = optionsWrap.querySelector('input[name="network-diagnosis"]:checked');
    if (!selected || usedCommands.size < 2 || resolved) return;

    const incident = incidents[current];

    if (selected.value === incident.answer) {
      resolved = true;
      feedback.textContent = incident.success;
      feedback.className = "nr-feedback is-success";
      applyButton.hidden = true;

      commandButtons.forEach((button) => {
        button.disabled = true;
      });

      if (current < incidents.length - 1) {
        nextButton.hidden = false;
      } else {
        finishChallenge();
      }
    } else {
      wrongAttempts += 1;
      feedback.textContent = "Not quite. Review the diagnostic evidence and try another diagnosis.";
      feedback.className = "nr-feedback is-error";
    }
  }

  function finishChallenge() {
    current = incidents.length;
    setProgress();

    const extraCommands = Math.max(0, totalCommands - 6);
    const score = Math.max(50, 100 - (extraCommands * 5) - (wrongAttempts * 10));

    scoreValue.textContent = `${score}%`;
    completePanel.hidden = false;
    diagnosisPanel.hidden = true;
    restartButton.hidden = false;
    restartButton.style.display = "inline-flex";
    completePanel.appendChild(restartButton);
  }

  function restart() {
    totalCommands = 0;
    wrongAttempts = 0;
    restartButton.style.display = "";
    loadIncident(0);
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => {
      runCommand(button.dataset.command, button);
    });
  });

  applyButton.addEventListener("click", applyFix);

  nextButton.addEventListener("click", () => {
    if (current < incidents.length - 1) {
      loadIncident(current + 1);
    }
  });

  restartButton.addEventListener("click", restart);

  loadIncident(0);
})();