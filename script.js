// color constants
const errorColor = "red";
const infoColor = "yellow";
const defaultColor = "greenyellow";
const tableHeaderColor = "orange";
const pureBlack = '#000';

// misc constants
const urlRegex = "^https?:\\\/\\\/(www.)?[a-z0-9-_]+\\.[a-z]+(\\\/?[a-zA-Z0-9#-_]+\\\/?)*";
const username = "cyberpirate92";
const socialMediaLinks = [
    {
        site: "LinkedIn",
        url: "https://linkedin.com/in/theja-bsr"
    },
    {
        site: "Twitter",
        url: "https://twitter.com/invictus_42"
    },
    {
        site: "StackOverflow",
        url: "https://stackoverflow.com/users/2526437/cyberpirate92"
    },
    {
        site: "Hackerrank",
        url: "https://www.hackerrank.com/cyberpirate92"
    },
    {
        site: "Personal Website/Blog",
        url: "https://ngravi.com"
    }
];

// loading related..
var isLoading = false;
var loadState = 0;
var timerHandle;
const loadingStates = ['/', '-', '\\', '|'];

var container = document.querySelector("#container");
var repos;
var commandHistory = [];
var historyIndex;
var commands = [
    {
        command: "help",
        description: "Show help",
        action: cmdHelp
    },
    {
        command: "clear",
        description: "Clear the screen",
        action: cmdClear 
    },
    {
        command: "projects",
        description: "View my projects (excluding forks and archived projects)",
        action: cmdProjects
    },
    {
        command: "history",
        description: "Show the last used 25 commands",
        action: cmdHistory
    },
    {
        command: "about",
        description: "About me",
        action: cmdAbout
    },
    {
        command: "social",
        description: "Show social media profiles",
        action: cmdSocial
    }
];

// global event listeners
window.addEventListener('click', (event) => {
    let current = getCurrentLine();
    if (current)
        current.focus();
});

window.addEventListener('load', () => {
    container = document.querySelector("#container");
    refreshApiRateCount();
    createLine(container); 
});


// command handlers
function cmdHelp(args) {
    createTable(commands, ['command', 'description']);
}

function cmdClear(args) {
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    createLine();
}

function cmdProjects(args) {
    if (!repos) {
        showLoading();
        const githubApiUrl = `https://api.github.com/users/${username}/repos?per_page=100`;
        var ajaxRequest = new XMLHttpRequest();
        ajaxRequest.addEventListener("load", () => {
            if (ajaxRequest.status === 200) {
                if (ajaxRequest.responseText) {
                    repos = JSON.parse(ajaxRequest.responseText);
                    showRepos(repos);                    
                }
                else {
                    error("API request failed, please try after some time");
                    console.log('API Responded with null');
                }
            }
            else {
                stopLoading();
                error(`API request failed with status ${ajaxRequest.status}`);
                if (ajaxRequest.status === 403) {
                    let resetSeconds = ajaxRequest.getResponseHeader("X-RateLimit-Reset");
                    let resetDate = new Date(resetSeconds * 1000);
                    error(`Github API rate limit exceeded, please try after ${resetDate.toLocaleDateString()}`);
                }
                createLine(container);
            }
            updateApiRateInfo(ajaxRequest);
        });
        ajaxRequest.addEventListener("error", (event) => {
            error("API request failed, please try after some time");
            console.log(event);
        });
        ajaxRequest.open("GET", githubApiUrl);
        ajaxRequest.send();
    }
    else {
        showRepos(repos);
    }
}

function cmdHistory(args) {
    if (!commandHistory || commandHistory.length <= 0) return;
    let startIndex = commandHistory.length > 25 ? commandHistory.length - 25 : 0;
    for (let i=startIndex; i<commandHistory.length; i++) {
        addTextLine(`${i-startIndex+1}. ${commandHistory[i]}`, infoColor);
    }
}

function cmdAbout(args) {
    addTextLines(`I'm Ravi Theja, Software Engineer from India.\n
    This webapp is a fun dev portifolio, still a work in progress and I plan to add a few fun games in the future :)\n
    You can get in touch with me at bsravi.tez@gmail.com`, infoColor);
}

function cmdSocial(args) {
    createTable(socialMediaLinks, ['site', 'url'], 'url');
}

// utility methods
function showLoading() {
    if (isLoading) return;
    
    isLoading = true;
    currentLine = getCurrentLine();
    timerHandle = window.setInterval(() => {
        setCurrentLineText(`Loading...${loadingStates[(loadState++)%loadingStates.length]}`);
    }, 100);
}

function stopLoading() {
    if (!isLoading) return;
    if (timerHandle) {
        window.clearInterval(timerHandle);
        timerHandle = null;
        var currentLine = getCurrentLine();
        if (currentLine) {
            currentLine.parentElement.remove();
        }
    }

    isLoading = !isLoading;
}

function showRepos(repoList) {
    stopLoading();
    let activeRepos = repoList.filter(r => r.fork === false && r.archived === false);
    createTable(activeRepos, ['name', 'language', 'description'], 'html_url');
    let currentLine = getCurrentLine();
    if (!currentLine) {
        createLine(container);
    }
}

function createTable(objArray, columns, linkProperty) {
    if (!objArray || !columns || objArray.length <= 0 || columns.length <= 0) return;
    
    let table = document.createElement("table");
    let tableHead = document.createElement("thead");
    let tableBody = document.createElement("tbody");
    
    tableHead.appendChild(getTableRow(columns, true, pureBlack, defaultColor));
    objArray.forEach(obj => {
        let data = [];
        columns.forEach(c => data.push(obj[c]));
        let row = getTableRow(data, false, infoColor);
        if (linkProperty && linkProperty.length > 0) {
            row.className = "clickable";
            row.addEventListener("click", () => {
                window.open(obj[linkProperty], '_blank');
            });
        }
        tableBody.appendChild(row);
    });

    table.appendChild(tableHead);
    table.appendChild(tableBody);
    table.className = "centeredTable";
    container.appendChild(table);
}

function getTableRow(data, isHeading, optionalTextColor, optionalBackgroundColor) {
    let row = document.createElement("tr");
    let websiteUrlRegex = new RegExp(urlRegex);
    for (let i=0; i<data.length; i++) {
        let col = document.createElement(isHeading ? "th" : "td");
        if (data[i] && data[i].match(websiteUrlRegex)) {
            col.appendChild(getLink(data[i], data[i]));
        }
        else {
            col.textContent = data[i];
        }
        if (optionalTextColor)
            col.style.color = optionalTextColor;
        if (optionalBackgroundColor)
            col.style.backgroundColor = optionalBackgroundColor;
        row.appendChild(col);
    }
    return row;
}

function getLink(linkHref, linkText) {
    var anchor = document.createElement("a");
    anchor.href = linkHref;
    anchor.textContent = linkText;
    return anchor;
}

function createLine(root) {
    if(!root) return;
    root.appendChild(getNewCommandLine());
    getCurrentLine().focus();
}

function createLineIfNotExists(root) {
    let currentLine = getCurrentLine();
    if (!currentLine || currentLine.contentEditable === false) {
        createLine(root);
    }
}

function processCommand(commandText) {
    commandText = commandText.trim();
    if (!commandText) return;
    let tokens = commandText.split(" ");
    if (tokens.length > 0) {
        let command = tokens[0];
        let found = false;
        for (let i=0; i<commands.length; i++) {
            if (commands[i].command === command) {
                commands[i].action(tokens.splice(1));
                found = true;
                break;
            }
        }
        if (!found) {
            error("Invalid command, try 'help' for a list of valid commands");
        }
        commandHistory.push(command);
        historyIndex = commandHistory.length - 1;
    }
}

function addTextLines(text, optionalTextColor) {
    if (!text) return;
    text.split("\n").forEach(t => {
        t = t.trim();
        if (t && t.length > 0) {
            addTextLine(t, optionalTextColor);
        }
    });
}

function addTextLine(text, optionalTextColor) {
    let textNode = document.createElement("div");
    textNode.textContent = text;
    if (optionalTextColor)
        textNode.style.color = optionalTextColor;
    container.appendChild(textNode);
}

function getCurrentLine() {
    return document.querySelector("#currentLine");
}

function error(message) {
    addTextLine(message, errorColor);
}

function info(message) {
    addTextLine(message, infoColor);
}

function setCurrentLineText(text) {
    let current = getCurrentLine();
    if (!current || !text) return;
    current.textContent = text;
    setCaret(current.childNodes[0], text.length);
}

function setCaret(element, position) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(element, position);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

function getNewCommandLine() {

    let preDiv = document.createElement("div");
    let span = document.createElement("span");
    let commandInput = document.createElement("div");

    span.textContent = "$>";
    span.className = "shellPrefix";
    commandInput.contentEditable = true;
    commandInput.className = "commandLineInput";
    commandInput.id = "currentLine";
    preDiv.className = "commandLine";

    preDiv.appendChild(span);
    preDiv.appendChild(commandInput);

    commandInput.addEventListener("keydown", function commandKeyDownListener(keyEvent) {
        if (keyEvent.keyCode === 13) {
            commandInput.contentEditable = false;
            commandInput.removeEventListener("keyDown", commandKeyDownListener);
            commandInput.id = "";

            let command = commandInput.textContent;
            processCommand(command.toLowerCase());
            
            createLineIfNotExists(container);
            return;
        }
        else if (keyEvent.keyCode === 38) { // UP Arrow
            setCurrentLineText(commandHistory[historyIndex]); 
            if (historyIndex > 0) {
                historyIndex -= 1;
            }
        }
        else if (keyEvent.keyCode === 40) { // DOWN arrow
            setCurrentLineText(commandHistory[historyIndex]);
            if (historyIndex < commandHistory.length-1) {
                historyIndex += 1;
            }
        }
        else {
            historyIndex = commandHistory.length - 1;
            return;
        }
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
    });

    return preDiv;
}

function updateApiRateInfo(request) {
    console.log(request.getAllResponseHeaders());
    let resetDate = (new Date(request.getResponseHeader("X-RateLimit-Reset") * 1000) || new Date());
    document.querySelector("#remainingRequests").textContent = request.getResponseHeader("X-RateLimit-Remaining") || 60;
    document.querySelector("#resetTime").textContent = `${resetDate.getHours()}:${resetDate.getMinutes()}`;
}

function refreshApiRateCount() {
    const url = "https://api.github.com/rate_limit";
    let request = new XMLHttpRequest();
    request.addEventListener("load", () => {
        updateApiRateInfo(request);
    });
    request.open("GET", url);
    request.send();
}