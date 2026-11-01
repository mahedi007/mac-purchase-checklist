/* Lidcheck content: checklist stages, detector questions, region codes */
/* ---------- data ---------- */
const TYPES = [
 {id:'new', name:'Brand new', sub:'Sealed, never activated'},
 {id:'openbox', name:'Open box', sub:'Opened or display unit'},
 {id:'applerefurb', name:'Apple refurbished', sub:'Certified by Apple'},
 {id:'refurb', name:'Third-party refurbished', sub:'Repaired by a shop'},
 {id:'used', name:'Second hand', sub:'Owned and used before'}
];
const TNAME = Object.fromEntries(TYPES.map(t=>[t.id,t.name]));
const REGIONS = {LL:'United States',B:'United Kingdom and Ireland',C:'Canada',CL:'Canada (French)',X:'Australia and New Zealand',ZP:'Hong Kong and Macau',HN:'India',J:'Japan',CH:'China mainland',TA:'Taiwan',KH:'South Korea',ZA:'Singapore',AB:'UAE, Saudi Arabia and Gulf',D:'Germany',FN:'France',T:'Italy',Y:'Spain',RU:'Russia',TH:'Thailand',TU:'Turkey',BZ:'Brazil'};
const PREFIX = {
 M:{label:'Retail unit', cls:'good', note:'Originally sold through normal retail. Could now be new, opened or used.'},
 F:{label:'Apple Certified Refurbished', cls:'good', note:'Refurbished by Apple, with a new battery and outer shell. From Apple it carries a 1 year warranty.'},
 N:{label:'Service replacement unit', cls:'flag', note:'Supplied by Apple as a replacement during a repair. Not a retail new unit.'},
 P:{label:'Personalized order', cls:'', note:'Custom or engraved order. Rare on Mac; ask where it was bought.'},
 Z:{label:'Custom configuration (CTO)', cls:'good', note:'Built to order with upgraded specs. Region is not part of this code; check the box or receipt.'}
};
const ANY = ['new','openbox','applerefurb','refurb','used'];
const NOTNEW = ['openbox','applerefurb','refurb','used'];
const PRE = ['openbox','refurb','used'];
const WORN = ['refurb','used'];
const L = (u,t)=>`<a href="${u}" target="_blank" rel="noopener">${t}</a>`;

const STAGES = [
{id:'seller', title:'Seller and listing', intro:'Do these before you pay or travel. They catch most scams early.', items:[
 {id:'s-auth', m:['new','openbox'], t:'Buy from Apple or an Authorized Reseller', d:`Check the shop at ${L('https://locate.apple.com','locate.apple.com')}. Grey market “new” Macs can be imported, re-sealed or already activated.`},
 {id:'s-aref', m:['applerefurb'], t:'Make sure it is Apple’s own refurbished store', db:true, d:`Only Macs sold by Apple, such as ${L('https://www.apple.com/shop/refurbished/mac','apple.com/shop/refurbished')}, are Apple Certified Refurbished. A shop saying “Apple refurbished” is usually a third-party refurb.`},
 {id:'s-refwho', m:['refurb'], t:'Get the refurb details in writing', d:'Who refurbished it, its grade (A, B or C), exactly which parts were replaced, and how long the shop’s warranty lasts.'},
 {id:'s-serial', m:ANY, db:true, t:'Verify the serial number online', d:`Enter it at ${L('https://checkcoverage.apple.com','checkcoverage.apple.com')}. The model must match the listing exactly. “Invalid serial” or a different model means walk away. Use the result in the <button class="link" data-goto="detect">condition detector</button>.`},
 {id:'s-part', m:ANY, t:'Decode the part number', d:'Looks like MRX33LL/A. The first letter shows new retail, Apple refurbished or replacement. The letters before /A show the country. <button class="link" data-goto="tools">Open the decoder</button>.', w:'System Information › Hardware › Model Number, or the box label'},
 {id:'s-specs', m:ANY, t:'Confirm the exact specs', d:`Compare chip, memory, storage, size and year with ${L('https://support.apple.com/specs','Apple’s tech specs')} or ${L('https://everymac.com/ultimate-mac-lookup/','EveryMac')}. Base models often get listed as higher configs.`},
 {id:'s-receipt', m:ANY, t:'Get a proper invoice', d:'For new and refurbished, a tax invoice from the shop with the serial printed. For second hand, the original receipt if possible; a company name on it can mean a managed corporate Mac.'},
 {id:'s-warranty', m:['new','openbox','applerefurb','refurb'], t:'Know the return window and warranty', d:'Get the return period and who handles warranty in writing before paying.'},
 {id:'s-ask', m:PRE, t:'Ask the key questions in writing', d:'Ever repaired or opened? Any liquid spill? Is Find My off? Managed by a company or school? Chat answers help if you need to dispute later.'},
 {id:'s-price', m:ANY, t:'Sanity check the price', d:'Far below market usually means stolen, locked, grey import or hidden damage.'},
 {id:'s-meet', m:['used'], t:'Meet somewhere safe with power and Wi‑Fi', d:'Public place, daytime, near a socket. Bring a phone hotspot, wired headphones, a USB device and a USB‑C cable. Plan for 45 to 60 minutes.'}
]},
{id:'box', title:'Box and contents', intro:'Packaging tells you a lot about where a Mac has been.', items:[
 {id:'x-tabs', m:['new'], db:true, t:'Seal tabs are intact', d:'Recent Mac boxes are sealed with paper pull tabs instead of plastic wrap. Torn, re-glued or missing tabs mean it was opened. Fresh plastic wrap on a recent model is a re-seal sign.'},
 {id:'x-white', m:['applerefurb'], t:'Plain white Apple refurb box', d:'Apple Certified Refurbished Macs ship in a plain white box with the model and a part number starting with F.'},
 {id:'x-label', m:['new','openbox','applerefurb'], db:true, t:'Box label matches the Mac', d:'Serial and part number on the box label must match System Information exactly.'},
 {id:'x-contents', m:['new','openbox','applerefurb'], t:'Correct charger and cable included', d:'New and Apple refurbished Macs include the matching power adapter and USB‑C cable, each in its own wrapping.'},
 {id:'x-region', m:['new','openbox'], t:'Region fits where you are buying', d:'An imported unit may have a different keyboard layout and plug. Check the region code on the box.'}
]},
{id:'outside', title:'Outside condition', intro:'Look closely under good light before switching on.', items:[
 {id:'o-serial3', m:ANY, db:true, t:'Serial matches in every place', d:'Bottom case, box and System Information must all show the same serial. A mismatch means a swapped board or case.'},
 {id:'o-flaw', m:['new','applerefurb'], t:'Finish is flawless', d:'No scratches, dents, key shine or worn rubber feet. Any wear means it is not new or not an Apple refurb.'},
 {id:'o-screws', m:PRE, t:'Bottom screws untouched', d:'Scratched or stripped screw heads mean it was opened. Ask what was done.'},
 {id:'o-dents', m:PRE, t:'No dents, bends or cracks', d:'Lay it flat and press each corner; it should not rock. Check lid corners and around ports.'},
 {id:'o-swell', m:PRE, db:true, t:'No swollen battery', d:'Lid not closing flush, trackpad raised or stiff, bottom bulging. Swelling is a fire risk.'},
 {id:'o-liquid', m:WORN, db:true, t:'No liquid damage', d:'Stains under keys, sticky keys, corrosion inside ports, cloudy marks at the screen edge.'},
 {id:'o-hinge', m:ANY, t:'Hinge holds any angle', d:'No drooping or wobble when you let go of the lid.'},
 {id:'o-coat', m:WORN, t:'Screen surface is clean', d:'Peeling anti-reflective coating (common on 2015 to 2017 Retina models) or key imprints on the screen.'},
 {id:'o-layout', m:ANY, t:'Keyboard layout matches the region', d:'A US (LL/A) Mac should have a US layout, UK (B/A) a UK layout. A mismatch suggests a replaced keyboard.'},
 {id:'o-charger', m:PRE, t:'Charger is genuine', d:'Genuine adapters feel dense with sharp print. Fakes are light, with blurry text and loose ports.'}
]},
{id:'locks', title:'Ownership and locks', intro:'A locked Mac is worthless to you, however good it looks.', items:[
 {id:'l-hello', m:['new','applerefurb'], t:'Boots to the Hello setup screen', d:'A new or Apple refurbished Mac should start straight at setup, with no user account.'},
 {id:'l-signout', m:PRE, db:true, t:'Seller signs out of their Apple Account', d:'In front of you. This needs their password and turns off Find My. Refusal means walk away.', w:'System Settings › [their name] › Sign Out'},
 {id:'l-al', m:ANY, db:true, t:'Activation Lock is Disabled', d:'Check in System Information.', w:'System Information › Hardware › Activation Lock Status'},
 {id:'l-erase', m:PRE, db:true, t:'Erase the Mac in front of you', d:'Apple silicon and T2 Macs: Erase All Content and Settings. Older Intel: erase the disk and reinstall from Recovery.', w:'System Settings › General › Transfer or Reset'},
 {id:'l-setup', m:ANY, db:true, t:'Setup finishes in your name', d:'An Activation Lock screen asking for someone else’s Apple Account, or a Remote Management screen, means stop.'},
 {id:'l-mdm', m:ANY, db:true, t:'No device management (MDM)', d:'Both lines should end in No.', cmd:'profiles status -type enrollment'},
 {id:'l-fw', m:PRE, t:'No unknown startup password', d:'Intel: restart holding Option; a padlock means a firmware password. Apple silicon: Recovery should not ask for an admin you don’t control.'},
 {id:'l-sip', m:ANY, t:'System Integrity Protection on', d:'Should report enabled.', cmd:'csrutil status'},
 {id:'l-upd', m:ANY, t:'Software Update works', d:'It should find and install updates without errors.', w:'System Settings › General › Software Update'}
]},
{id:'history', title:'Specs, age and repairs', intro:'Confirm what you get and how old it really is.', items:[
 {id:'h-specs', m:ANY, t:'Specs match the listing', d:'One command shows model, chip, memory, serial, Activation Lock and battery. Paste the output into the <button class="link" data-goto="detect">detector</button> to fill it automatically.', cmd:'system_profiler SPHardwareDataType SPPowerDataType | grep -E "Model Name|Model Identifier|Model Number|Chip|Processor Name|Memory|Serial Number|Activation Lock|Cycle Count|Condition|Maximum Capacity"'},
 {id:'h-cov', m:ANY, db:true, t:'Coverage dates fit the claim', d:'New: purchase date not yet validated, or warranty starting today. Apple refurbished: a fresh 1 year from your purchase. Used: the dates reveal its real age.'},
 {id:'h-parts', m:ANY, t:'Parts & Service shows no Unknown parts', d:`On Apple silicon Macs with macOS Tahoe 26 or later this section appears only after a repair. Genuine or Used are Apple parts. Unknown part means non-genuine. ${L('https://support.apple.com/123123','Apple’s guide')}.`, w:'System Settings › General › About › Parts & Service'},
 {id:'h-smart', m:ANY, t:'Storage health is Verified', d:'S.M.A.R.T. status should read Verified, and Disk Utility First Aid should pass.', cmd:'system_profiler SPNVMeDataType SPSerialATADataType | grep -i smart'},
 {id:'h-panic', m:WORN, t:'No recent crash reports', d:'Many recent panic files mean unstable hardware. Check before erasing.', cmd:'ls -lt /Library/Logs/DiagnosticReports | grep -i panic'}
]},
{id:'battery', title:'Battery and charging', intro:'Cycle count is the hardest thing for a seller to hide.', items:[
 {id:'b-cyc', m:ANY, t:'Cycle count fits the claim', d:'New: a handful at most from factory testing. Apple refurbished: near zero, since the battery is replaced. Used: under 300 is great, above 800 means budget for a battery (most are rated for 1000).', w:'System Information › Power › Cycle Count'},
 {id:'b-health', m:ANY, t:'Battery health is Normal', d:'Maximum Capacity should be 100% on new. Above 80% is healthy on used. “Service Recommended” means replacement is due.', w:'System Settings › Battery › Battery Health'},
 {id:'b-ports', m:ANY, t:'Charges from every port', d:'Plug the charger into each USB‑C and MagSafe port and confirm it charges.', w:'System Information › Power › AC Charger Information'},
 {id:'b-drain', m:PRE, t:'Holds charge for 15 minutes', d:'Play video at half brightness unplugged. The drop should be gradual, with no sudden shutdowns.'}
]},
{id:'display', title:'Display', intro:'Screen repairs are among the most expensive.', items:[
 {id:'d-px', m:ANY, t:'No dead or stuck pixels', d:'Run the <button class="link" data-goto="tools">full screen color test</button>.'},
 {id:'d-bleed', m:ANY, t:'Even backlight', d:'On black at full brightness, check edges for bright patches. Slight glow around bright objects on 14 and 16 inch Pro (mini‑LED) is normal.'},
 {id:'d-bright', m:ANY, t:'Brightness and True Tone work', d:'Slide through the full range. Flicker or bands is a fault.'},
 {id:'d-cable', m:WORN, t:'No flicker when opening the lid', d:'Flicker or uneven shadows at the bottom edge points to a failing display cable, common on 2016 to 2018 13 inch Pro.'},
 {id:'d-pro', m:ANY, t:'ProMotion on 14 and 16 inch Pro', d:'Refresh Rate should offer ProMotion. If not, the screen may be a replacement.', w:'System Settings › Displays'}
]},
{id:'input', title:'Keyboard, trackpad and Touch ID', intro:'Top case repairs can cost as much as a battery.', items:[
 {id:'k-keys', m:ANY, t:'Every key registers', d:'Use the <button class="link" data-goto="tools">key tester</button>. No sticky or double letters. Check Caps Lock light and backlight.'},
 {id:'k-tid', m:ANY, t:'Touch ID enrolls and unlocks', d:'A sensor that won’t enroll can mean a replaced or unpaired part.', w:'System Settings › Touch ID & Password'},
 {id:'k-pad', m:ANY, t:'Trackpad clicks and gestures', d:'Click every corner and the center, Force Click, scroll, pinch and swipe.'}
]},
{id:'io', title:'Sound, camera and ports', intro:'Quick checks that sellers rarely mention.', items:[
 {id:'a-spk', m:ANY, t:'Both speakers, no rattle', d:'Use the <button class="link" data-goto="tools">speaker test</button> at high volume.'},
 {id:'a-mic', m:ANY, t:'Microphone records clearly', d:'Record in Voice Memos and play it back.'},
 {id:'a-cam', m:ANY, t:'Camera works', d:'Photo Booth shows a clear image and the green light turns on.'},
 {id:'a-jack', m:ANY, t:'Headphone jack works', d:'Audio switches to wired headphones.'},
 {id:'a-wl', m:ANY, t:'Wi‑Fi and Bluetooth connect', d:'Load a page and pair a phone or earbuds.'},
 {id:'a-ports', m:ANY, t:'Every port passes data', d:'Plug a USB device into each port; also HDMI and SD card if present.'}
]},
{id:'diag', title:'Diagnostics and stress test', intro:'Where hidden faults show up.', items:[
 {id:'z-diag', m:ANY, db:true, t:'Apple Diagnostics finds no issues', d:'Apple silicon: shut down, hold power until startup options appear, then press Command‑D. Intel: restart holding D. Note any reference code.'},
 {id:'z-stress', m:PRE, db:true, t:'Survives 10 minutes at full load', d:'Loads every CPU core. Watch for freezes, shutdowns or grinding fans. MacBook Air has no fan and gets warm, which is normal. Stop with <code>killall yes</code>.', cmd:'for i in $(seq $(sysctl -n hw.ncpu)); do yes > /dev/null & done'},
 {id:'z-sleep', m:ANY, t:'Wakes properly from sleep', d:'Close the lid for a minute; it should wake straight to the login screen.'}
]},
{id:'pay', title:'Paying and after', intro:'Only pay once every deal-breaker passes.', items:[
 {id:'p-after', m:['used'], t:'Pay after all checks, never before', d:'No deposits for courier delivery. Pay in person once it is set up in your name.'},
 {id:'p-receipt', m:ANY, t:'Keep a written receipt', d:'Seller name and contact, date, price, serial number, and a line stating it is sold free of locks.'},
 {id:'p-box', m:['new','openbox','applerefurb','refurb'], t:'Keep the box through the return window', d:'Returns usually need all original packaging.'},
 {id:'p-cov', m:ANY, t:'Recheck coverage and AppleCare', d:`Run the serial at ${L('https://checkcoverage.apple.com','checkcoverage.apple.com')} again and see if AppleCare can be added.`},
 {id:'p-find', m:ANY, t:'Turn on Find My', d:'Sign in with your Apple Account and turn on Find My Mac.'}
]}
];

const QS = [
 {id:'box', icon:'package', t:'Box and packaging', h:'Check it before anything is opened.', o:[['sealed','Sealed, pull tabs intact'],['opened','Retail box, already opened'],['white','Plain white Apple refurb box'],['generic','Generic or shop box'],['none','No box']]},
 {id:'cover', icon:'shield-check', t:'Apple coverage result', h:`Enter the serial at ${L('https://checkcoverage.apple.com','checkcoverage.apple.com')}.`, o:[['notact','Purchase date not validated'],['fresh','Warranty active, nearly a full year left'],['partial','Warranty active, some months used'],['applecare','AppleCare active'],['expired','Coverage expired']]},
 {id:'cos', icon:'sparkles', t:'Cosmetic condition', h:'Corners, bottom feet, keys and ports.', o:[['flawless','Flawless'],['light','Light marks or key shine'],['worn','Clear scratches or dents']]},
 {id:'parts', icon:'cpu', t:'Parts & Service', h:'System Settings › General › About. Needs Apple silicon and macOS Tahoe 26 or later.', o:[['none','Not shown'],['genuine','Shows Genuine or Used parts'],['unknown','Shows Unknown part'],['na','Can’t check on this Mac']]},
 {id:'boot', icon:'power', t:'First power on', h:'What appeared the first time you opened the lid.', o:[['hello','Hello setup screen'],['account','Already signed in']]},
 {id:'claim', icon:'message-circle', t:'What the seller calls it', h:'Lidcheck compares this with the evidence.', o:TYPES.map(t=>[t.id,t.name])}
];


