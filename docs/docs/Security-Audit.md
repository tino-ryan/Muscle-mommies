# Security Audit of the NPM Supply Chain Attacks: A Software Design Case Study

## Introduction

The modern-day software design field often relies heavily on third-party packages to speed up development and provide reusable functionality. While this significantly enhances productivity, it also introduces vulnerabilities that can be exploited through supply chain attacks. These attacks occur when malicious actors compromise a package or dependency used by other projects, allowing malware to spread to multiple downstream applications.

The recent attacks on NPM, specifically those targeting **Debug** and **Chalk/TinyColor** packages, highlight the inherent risks of relying on widely used open-source dependencies. The goal of this security audit is to analyse these attacks, assess the impact on _The Box_ project, and propose mitigation strategies to prevent similar breaches in future development cycles.

---

## Overview of the Attacks

### Debug Package Compromise

The **debug** package is widely used for logging in Node.js applications. In this attack, the maintainer’s account was compromised, allowing the attacker to publish versions `2.6.9` through `2.6.11` containing malicious code. The injected payload executed unauthorised network requests, potentially exfiltrating sensitive data from affected applications.
The point of failure was weak maintainer credential security, underscoring the risks of compromised accounts in the open-source ecosystem.

### Chalk/TinyColor Package Compromise

The **TinyColor** package was similarly compromised through an NPM supply chain attack. Versions `1.4.0` to `1.4.2` were injected with malicious code that propagated through dependent libraries. Attackers leveraged npm’s automated publishing pipeline and community trust, highlighting the importance of rigorous verification and security hygiene among maintainers.

Both incidents demonstrate how a single compromised dependency can cascade across thousands of downstream projects in the NPM ecosystem.

---

## Audit of Project Dependencies

To evaluate whether _The Box_ was affected, both **frontend** and **backend** dependencies (`package.json` and `package-lock.json`) were examined using an automated verification process.

### Methodology

A custom Python script was developed to check for potential exposure to compromised packages.

1. **Input:** A JSON list of compromised packages and affected versions (derived from Aikido and Socket.dev advisories).
2. **Dependency Parsing:** The script recursively traversed both direct and transitive dependencies.
3. **Version Comparison:** Each dependency version was compared against the compromised list.
4. **Reporting:** Matches were flagged and compiled into an audit report.

Additionally, `npm audit` was executed to cross-check the dependency tree against the official NPM vulnerability database.

---

## Results

The audit confirmed that no dependencies in either the frontend or backend matched compromised versions. None of the transitive dependencies relied on affected packages, indicating that _The Box_ was not directly exposed to the reported NPM supply chain attacks.

### Summary of the Audit

| Package             | Version | Compromised? | Action Required |
| ------------------- | ------- | ------------ | --------------- |
| ansi-styles         | 6.2.2   | No           | None            |
| debug               | 4.4.2   | No           | None            |
| chalk               | 5.6.1   | No           | None            |
| strip-ansi          | 7.1.1   | No           | None            |
| color-convert       | 3.1.1   | No           | None            |
| color-name          | 2.0.1   | No           | None            |
| color-string        | 2.1.1   | No           | None            |
| slice-ansi          | 7.1.1   | No           | None            |
| wrap-ansi           | 9.0.1   | No           | None            |
| supports-color      | 10.2.1  | No           | None            |
| supports-hyperlinks | 4.1.1   | No           | None            |
| simple-swizzle      | 0.2.3   | No           | None            |
| is-arrayish         | 0.3.3   | No           | None            |
| backslash           | 0.2.1   | No           | None            |
| chalk-template      | 1.1.1   | No           | None            |
| error-ex            | 1.3.3   | No           | None            |
| has-ansi            | 6.0.1   | No           | None            |
| ansi-regex          | 6.2.1   | No           | None            |
| proto-tinker-wc     | 1.8.7   | No           | None            |

---

## Risk Analysis

Even though _The Box_ was unaffected, supply chain attacks remain a credible threat. If compromised packages had been present, potential impacts could include:

- **Unauthorized code execution** on developer or production machines
- **Data exfiltration** of credentials or sensitive Firestore data
- **Integrity loss** through malicious modification of business logic

Transitive dependencies increase these risks, as trusted direct dependencies may conceal vulnerable or compromised packages further down the chain. Ongoing vigilance and dependency monitoring are therefore essential.

---

## Mitigation Strategies

### Protecting Against Upstream Package Attacks

- **Version Pinning:** Lock dependency versions using `package-lock.json` to prevent unintended upgrades.
- **Regular Audits:** Run `npm audit` or automated scans routinely.
- **Dependency Minimization:** Avoid unnecessary third-party packages.
- **Selection Criteria:** Choose libraries with strong maintenance histories and active communities.
- **CI/CD Security Checks:** Integrate vulnerability scanning into continuous integration pipelines.

### Protecting the Project Itself

- **Controlled Build Environments:** Isolate build environments and limit permissions.
- **Monitoring and Logging:** Track suspicious network or runtime activity.
- **Patch Management:** Keep tools and dependencies up to date.
- **Developer Awareness:** Educate team members on secure package management practices.

---

## Conclusion

The NPM supply chain attacks serve as a reminder that dependency-driven development carries inherent risks. Through a structured audit, _The Box_ was verified as **unaffected** by the September 2025 NPM compromises. Nonetheless, the exercise underscored the importance of proactive security measures such as dependency version control, automated auditing, and informed library selection.

Embedding these best practices into daily workflows enhances resilience, maintains user trust, and strengthens overall software integrity.

---

## References

- Aikido Security. (2025, September 12). _NPM debug and chalk packages compromised_. Retrieved from [https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised](https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised)
- Socket.dev. (2025, September 15). _TinyColor supply chain attack affects 40 packages_. Retrieved from [https://socket.dev/blog/tinycolor-supply-chain-attack-affects-40-packages](https://socket.dev/blog/tinycolor-supply-chain-attack-affects-40-packages)
- NPM Documentation. (2025). _npm audit_. Retrieved from [https://docs.npmjs.com/cli/v10/commands/npm-audit](https://docs.npmjs.com/cli/v10/commands/npm-audit)

---

## Appendix A: Audit Script

> This script was executed against both `client/package-lock.json` and `server/package-lock.json` using a compromised package list derived from Aikido and Socket.dev advisories.

```python
import json
import csv
import os

def load_compromised_json(path):
    with open(path) as f:
        return json.load(f)

compromised = load_compromised_json("compromised.json")
print(f"Loaded {len(compromised)} compromised packages from compromised.json")

def scan_lockfile(lockfile_path, compromised, report_list):
    if not os.path.exists(lockfile_path):
        print(f"❌ File not found: {lockfile_path}")
        return
    with open(lockfile_path) as f:
        lock_data = json.load(f)
    def recurse(deps, path=""):
        for pkg, info in deps.items():
            ver = info.get("version")
            cur_path = f"{path} > {pkg}" if path else pkg
            if pkg in compromised and ver in compromised[pkg]:
                report_list.append({
                    "lockfile": lockfile_path,
                    "package": pkg,
                    "version": ver,
                    "path": cur_path
                })
            if "dependencies" in info:
                recurse(info["dependencies"], cur_path)
    recurse(lock_data.get("dependencies", {}), "")

def main():
    report = []
    lockfiles = ["client/package-lock.json", "server/package-lock.json", "package-lock.json"]
    print("🔍 Running NPM Security Audit...\n")
    for lf in lockfiles:
        scan_lockfile(lf, compromised, report)
    if not report:
        print("✅ No compromised packages detected.\n")
    else:
        print("⚠️  Compromised packages found!\n")
        for r in report:
            print(f"{r['lockfile']} | {r['package']} | {r['version']}")
    os.makedirs("audit_reports", exist_ok=True)
    with open("audit_reports/audit_report.json", "w") as f:
        json.dump(report, f, indent=2)
    with open("audit_reports/audit_report.csv", "w", newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["lockfile", "package", "version", "path"])
        writer.writeheader()
        writer.writerows(report)
    print("Reports saved to 'audit_reports'.")

if __name__ == "__main__":
    main()
```

---

## Appendix B: Compromised Package List

> A JSON file containing a compromised package list derived from Aikido and Socket.dev advisories.

```json
{
  "ansi-styles": ["6.2.2"],
  "debug": ["4.4.2"],
  "chalk": ["5.6.1"],
  "strip-ansi": ["7.1.1"],
  "color-convert": ["3.1.1"],
  "color-name": ["2.0.1"],
  "color-string": ["2.1.1"],
  "slice-ansi": ["7.1.1"],
  "wrap-ansi": ["9.0.1"],
  "supports-color": ["10.2.1"],
  "supports-hyperlinks": ["4.1.1"],
  "simple-swizzle": ["0.2.3"],
  "is-arrayish": ["0.3.3"],
  "backslash": ["0.2.1"],
  "chalk-template": ["1.1.1"],
  "error-ex": ["1.3.3"],
  "has-ansi": ["6.0.1"],
  "ansi-regex": ["6.2.1"],
  "proto-tinker-wc": ["1.8.7"]
}
```

---

## Appendix C: Audit Results

![Audit Results Screenshot](/images/audit_results.png)
**Figure 1.** Successful execution of the dependency audit script showing no compromised packages detected.
