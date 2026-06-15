from pathlib import Path
import re

changed = []
report = []


def write_if_changed(path: str, text: str) -> None:
    file_path = Path(path)
    old = file_path.read_text(encoding="utf-8")
    if old != text:
        file_path.write_text(text, encoding="utf-8")
        changed.append(path)


# ACE Cluster: replace obsolete 15:00 / Scorpio profile projection.
path = "Jester-Intelligence/ACED-Lifestyle/ace-cluster.html"
text = Path(path).read_text(encoding="utf-8")
old = "const FW={name:'Manuel Rui Santos Ferreira',birth:'1972-08-15',birthYear:1972,birthMonth:8,birthDay:15,birthHour:15,dayMaster:'Wu',dayMasterElement:'Earth',lifePathRaw:33,lifePathReduced:6,expressionRaw:111,expressionReduced:3,sunSign:'Leo',ascSign:'Scorpio',keyNums:[3,6,9,11,22,33]};"
new = "const FW={name:'Manuel Rui Santos Ferreira',birth:'1972-08-15',birthYear:1972,birthMonth:8,birthDay:15,birthHour:9,birthTimeLocal:'09:00',birthTimeUtc:'08:00',birthPlace:'Porto, Portugal',dayMaster:'Wu',dayMasterElement:'Earth',baziHour:'Bing Chen',baziHourAnimal:'Dragon',lifePathRaw:33,lifePathReduced:6,expressionRaw:111,expressionReduced:3,sunSign:'Leo',ascSign:'Virgo',ascendant:'Virgo 18°20′09″',midheaven:'Gemini 16°23′57″',siderealAscendant:'Leo 23°58′25″',canonicalProfileVersion:'3.3_UNIVERSAL',interpretationOrder:['geometry','universal human meaning','full-domain scan','personal resonance','current application'],keyNums:[3,6,9,11,22,33]};"
if old not in text:
    raise SystemExit("ACE Cluster exact profile constant not found; migration stopped")
text = text.replace(old, new, 1)
text = text.replace("const APP_VERSION='3.1.4-clean-ui-direct-open';", "const APP_VERSION='3.1.5-canonical-profile-v3-3';", 1)
marker = "flamewalker-canonical-profile-v3-3.js"
if marker not in text:
    boot = '''
<script src="./shared/js/flamewalker-canonical-profile-v3-3.js"></script>
<script>
(function(){
  function applyCanonicalCluster(){
    if(!window.FlamewalkerCanonicalProfileV33)return;
    window.FlamewalkerCanonicalProfileV33.load(true).then(function(p){
      return window.FlamewalkerCanonicalProfileV33.applyCluster(p);
    }).catch(function(e){console.warn('ACE Cluster canonical profile failed',e);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyCanonicalCluster,{once:true});
  else setTimeout(applyCanonicalCluster,0);
})();
</script>
'''
    text = text.replace("</body>", boot + "</body>", 1)
write_if_changed(path, text)
report.append("ACE Cluster corrected to 09:00 local / 08:00 UT, Virgo Ascendant, Gemini MC, Bing Chen hour.")


# Investment Cockpit: update embedded personal profile constant.
path = "investment-cockpit-v11.html"
text = Path(path).read_text(encoding="utf-8")
old_block = '''const FW_PROFILE = {
  name: "Manuel Rui Santos Ferreira",
  birth: "1972-08-15",
  birthMonth: 8,
  birthDay: 15,
  birthHour: 15,
  dayMaster: "Wu",
  dayMasterElement: "Earth",
  lifePathRaw: 33,
  lifePathReduced: 6,
  expressionRaw: 111,
  expressionReduced: 3
};'''
new_block = '''const FW_PROFILE = {
  name: "Manuel Rui Santos Ferreira",
  birth: "1972-08-15",
  birthMonth: 8,
  birthDay: 15,
  birthHour: 9,
  birthTimeLocal: "09:00",
  birthTimeUtc: "08:00",
  birthPlace: "Porto, Portugal",
  ascSign: "Virgo",
  ascendant: "Virgo 18°20′09″",
  midheaven: "Gemini 16°23′57″",
  siderealAscendant: "Leo 23°58′25″",
  dayMaster: "Wu",
  dayMasterElement: "Earth",
  baziHour: "Bing Chen",
  baziHourAnimal: "Dragon",
  lifePathRaw: 33,
  lifePathReduced: 6,
  expressionRaw: 111,
  expressionReduced: 3,
  canonicalProfileVersion: "3.3_UNIVERSAL",
  interpretationRule: "Universal human meaning before vocational or project application"
};'''
if old_block not in text:
    raise SystemExit("Investment Cockpit exact profile block not found; migration stopped")
text = text.replace(old_block, new_block, 1)
text = text.replace('const APP_VERSION = "2.6.0-exact-inspect-seal";', 'const APP_VERSION = "2.6.1-canonical-profile-v3-3";', 1)
write_if_changed(path, text)
report.append("Investment Cockpit corrected; market logic unchanged.")


# ACE Mind direct body: load the canonical runtime bridge after the main app script.
path = "Jester-Intelligence/ACED-Lifestyle/ace-mind.html"
text = Path(path).read_text(encoding="utf-8")
marker = "flamewalker-canonical-profile-v3-3.js"
if marker not in text:
    boot = '''
<script src="./shared/js/flamewalker-canonical-profile-v3-3.js"></script>
<script>
(function(){
  function applyCanonicalAceMind(){
    if(!window.FlamewalkerCanonicalProfileV33)return;
    window.FlamewalkerCanonicalProfileV33.load(true).then(function(p){
      return window.FlamewalkerCanonicalProfileV33.applyAceMind(p);
    }).catch(function(e){console.warn('ACE Mind canonical profile failed',e);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyCanonicalAceMind,{once:true});
  else setTimeout(applyCanonicalAceMind,0);
})();
</script>
'''
    index = text.rfind("</body>")
    if index < 0:
        raise SystemExit("ACE Mind closing body not found")
    text = text[:index] + boot + text[index:]
write_if_changed(path, text)
report.append("ACE Mind direct and wrapped routes use canonical v3.3 natal geometry and governance.")


# Audit critical obsolete fingerprints only. Legitimate Scorpio Moon/symbol references are preserved.
critical = []
patterns = [r"birthHour\s*:\s*15\b", r"ascSign\s*:\s*'Scorpio'", r'ascSign\s*:\s*"Scorpio"']
for file_path in Path(".").rglob("*"):
    if not file_path.is_file() or ".git" in file_path.parts:
        continue
    if file_path.suffix.lower() not in {".html", ".js", ".json", ".md", ".txt", ".jsx", ".ts", ".tsx"}:
        continue
    try:
        data = file_path.read_text(encoding="utf-8")
    except Exception:
        continue
    for pattern in patterns:
        if re.search(pattern, data):
            critical.append(f"{file_path}: {pattern}")
if critical:
    raise SystemExit("Obsolete critical profile fingerprints remain:\n" + "\n".join(critical))

report_path = Path("docs/migrations/flamewalker-profile-v3-3-migration-report.md")
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(
    "# Flamewalker Profile v3.3 App Migration\n\n"
    "Canonical source: `Jester-Intelligence/ACED-Lifestyle/shared/data/flamewalker-canonical-esoteric-profile-v3-3.json`\n\n"
    "## Applied\n\n- " + "\n- ".join(report) + "\n\n"
    "## Preserved\n\n"
    "- Daily BaZi date-cycle anchors were not changed.\n"
    "- Mayan daily calculations were not replaced by natal count labels.\n"
    "- Supplement blocks, body vetoes, portfolio data, and creative content were not modified.\n"
    "- Flamewalker Studio contains no obsolete birth-hour or Ascendant constant, so no profile mutation was required there.\n\n"
    "## Governance\n\n"
    "Geometry first, then universal human meaning, full-domain scan, personal resonance, and only then current application. Vocation is one domain, not the master key.\n",
    encoding="utf-8",
)
changed.append(str(report_path))

print("Changed files:")
for item in changed:
    print(item)
