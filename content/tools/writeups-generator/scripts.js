//Functions for Description Buttons
let boldInput_desc = () => {
    document.getElementById("description").value += "**Your Text**";
}
let italicInput_desc = () => {
    document.getElementById("description").value += "*Your Text*";
}
let codeInput_desc = () => {
    document.getElementById("description").value += "`Your code`";
}
let listInput_desc = () => {
    document.getElementById("description").value += "\n- Your text";
}
let citationInput_desc = () => {
    document.getElementById("description").value += "> Your text";
}
let addImage_desc = () => {
    document.getElementById("description").value += "![Your text](./image link)";
}
let addFile_desc = () => {
    document.getElementById("description").value += "![Your text](./your link)";
}
let linkInput_desc = () => {
        document.getElementById("description").value += "[Your Text](Your Link)";
}
let enterInput_desc = () => {
    document.getElementById("description").value += "  \n";
}


//Functions for Solution Buttons
let boldInput_soluce = () => {
    document.getElementById("solution").value += "**Your Text**";
}
let italicInput_soluce = () => {
    document.getElementById("solution").value += "*Your Text*";
}
let codeInput_soluce = () => {
    document.getElementById("solution").value += "`Your code`";
}
let listInput_soluce = () => {
    document.getElementById("solution").value += "\n- Your text";
}
let citationInput_soluce = () => {
    document.getElementById("solution").value += "> Your text";
}
let addImage_soluce = () => {
    document.getElementById("solution").value += "![Your text](./image link)";
}
let addFile_soluce = () => {
    document.getElementById("solution").value += "![Your text](./your link)";
}
let linkInput_soluce = () => {
        document.getElementById("solution").value += "[Your Text](Your Link)";
}
let enterInput_soluce = () => {
    document.getElementById("solution").value += "  \n";
}

/*
function addHint() {
    var scntDiv = $('#p_scents');
    var i = $('#p_scents p').size() + 1;
    
    $('#addScnt').live('click', function() {
            $('<p><label for="p_scnts"><input type="text" id="p_scnt" size="20" name="p_scnt_' + i +'" value="" placeholder="Input Value" /></label> <a href="#" id="remScnt">Remove</a></p>').appendTo(scntDiv);
            i++;
            return false;
    });
    
    $('#remScnt').live('click', function() { 
            if( i > 2 ) {
                    $(this).parents('p').remove();
                    i--;
            }
            return false;
    });
}
*/




let markdownBuild = () => {   	
    // Récupére le contenu de chaque input
    const title = document.getElementById('txtTitle');
    const category = document.getElementById('txtCategory');
    const points = document.getElementById('txtPoints');
    const solves = document.getElementById('txtSolves');
    const description = document.getElementById('description');
    const solution = document.getElementById('solution');
    const flag = document.getElementById('txtFlag');
    
    // Mise en forme des données
    const data = 
    '### ' + title.value + '   \n' + 
    '**Category:** ' + category.value + ' - **Points:** ' + points.value + ' - **Solves:** ' + solves.value + '   \n\n' + 
    '**Description:**   \n' + description.value + '   \n\n' +
    '**Solution:**  \n' + solution.value + '   \n\n' +
    "<details><summary>🚩 FLAG</summary>  \n\n" +
    "```  \n" +   
    flag.value + "  \n" +
    "```  \n" +
    "</details>";
    
    // Conversion du text en BLOB
    const textToBLOB = new Blob([data], { type: 'text/plain' });
    // Chemin où est rangé le fichier
    const sFileName = 'readme.md';

    let newLink = document.createElement("a");
    newLink.download = sFileName;

    if (window.webkitURL != null) {
        newLink.href = window.webkitURL.createObjectURL(textToBLOB);
    }
    else {
        newLink.href = window.URL.createObjectURL(textToBLOB);
        newLink.style.display = "none";
        document.body.appendChild(newLink);
    }

    newLink.click(); 
}


  
