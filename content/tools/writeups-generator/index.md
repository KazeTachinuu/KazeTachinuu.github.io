<head>
  <title>WriteUps Generator</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
  <link rel="stylesheet" href="styles.css">
  <script src="scripts.js"></script>
</head>
<div>
<body>
{{< return_home >}}
  <div class="wrapper">
    <header>WriteUps Generator</header>
    <form action="#">
      <div class="dbl-field">
        <div class="field">
          <input type="text" id="txtTitle" name="txtTitle" placeholder="Title">
          <i class='bi bi-hash'></i>
        </div>
        <div class="field">
          <input type="text" id="txtCategory" name="txtCategory" placeholder="Category">
          <i class='bi bi-folder-fill'></i>
        </div>
      </div>
      <div class="dbl-field">
        <div class="field">
          <input type="number" id="txtPoints" name="txtPoints" placeholder="Points">
          <i class='bi bi-123'></i>
        </div>
        <div class="field">
          <input type="number" id="txtSolves" name="txtSolves" placeholder="Solves">
          <i class='bi bi-question-circle-fill'></i>
        </div>
      </div>
      <div class="buttons">
        <button type="button" id="boldBtn_desc" class="optionsBtn" title="Bold" onclick="boldInput_desc()"><i
            class="bi bi-type-bold"></i></button>
        <button type="button" id="italicBtn_desc" class="optionsBtn" title="Italic" onclick="italicInput_desc()"><i
            class="bi bi-type-italic"></i></button>
        <button type="button" id="codeBtn_desc" class="optionsBtn" title="Code" onclick="codeInput_desc()"><i
            class="bi bi-code-slash"></i></button>
        <button type="button" id="listBtn_desc" class="optionsBtn" title="List" onclick="listInput_desc()"><i
            class="bi bi-list-ul"></i></button>
        <button type="button" id="citationBtn_desc" class="optionsBtn" title="Citation"
          onclick="citationInput_desc()"><i class="bi bi-blockquote-left"></i></button>
        <button type="button" id="addImageBtn_desc" class="optionsBtn" title="Image" onclick="addImage_desc()"><i
            class="bi bi-image-fill"></i></button>
        <button type="button" id="addFileBtn_desc" class="optionsBtn" title="Add file" onclick="addFile_desc()"><i
            class="bi bi-file-earmark-plus-fill"></i></button>
        <button type="button" id="linkBtn_desc" class="optionsBtn" title="Link" onclick="linkInput_desc()"><i
            class="bi bi-link-45deg"></i></button>
        <button type="button" id="enterBtn_desc" class="optionsBtn" title="Enter (new line)"
          onclick="enterInput_desc()"><i class="bi bi-arrow-return-left"></i></button>
      </div>
      <div class="message">
        <textarea placeholder="Description" id="description" name="description"></textarea>
        <i class='bi bi-text-indent-left'></i>
      </div>
      <div class="buttons">
        <button type="button" id="boldBtn_soluce" class="optionsBtn" title="Bold" onclick="boldInput_soluce()"><i
            class="bi bi-type-bold"></i></button>
        <button type="button" id="italicBtn_soluce" class="optionsBtn" title="Italic" onclick="italicInput_soluce()"><i
            class="bi bi-type-italic"></i></button>
        <button type="button" id="codeBtn_soluce" class="optionsBtn" title="Code" onclick="codeInput_soluce()"><i
            class="bi bi-code-slash"></i></button>
        <button type="button" id="listBtn_soluce" class="optionsBtn" title="List" onclick="listInput_soluce()"><i
            class="bi bi-list-ul"></i></button>
        <button type="button" id="citationBtn_soluce" class="optionsBtn" title="Citation"
          onclick="citationInput_soluce()"><i class="bi bi-blockquote-left"></i></button>
        <button type="button" id="addImageBtn_soluce" class="optionsBtn" title="Image" onclick="addImage_soluce()"><i
            class="bi bi-image-fill"></i></button>
        <button type="button" id="addFileBtn_soluce" class="optionsBtn" title="Add file" onclick="addFile_soluce()"><i
            class="bi bi-file-earmark-plus-fill"></i></button>
        <button type="button" id="linkBtn_soluce" class="optionsBtn" title="Link" onclick="linkInput_soluce()"><i
            class="bi bi-link-45deg"></i></button>
        <button type="button" id="enterBtn_soluce" class="optionsBtn" title="Enter (new line)"
          onclick="enterInput_soluce()"><i class="bi bi-arrow-return-left"></i></button>
      </div>
      <div class="message">
        <textarea placeholder="Solution" id="solution" name="solution"></textarea>
        <i class='bi bi-body-text'></i>
      </div>
      <div class="dbl-field">
        <div class="field">
          <input type="text" id="txtFlag" name="txtFlag" placeholder="Flag">
          <i class='bi bi-flag-fill'></i>
        </div>
      </div>
      <div class="button-area">
        <button type="button" id="bt" onclick="markdownBuild()">Generate WriteUp</button>
        <span>
        </span>
      </div>
    </form>
  </div>
  <script src="js/writeups-generator/scripts.js"></script>
</body>
