define(['styleSelect'], function(styleSelect){
  var log = console.log.bind(console)

  styleSelect('select')
  log('Select box above should now by styled')
  log("Check the value of the real select box with: document.querySelector('select').value")
  log("Check the text of the real select box with: var select = document.querySelector('select'); select.options[select.selectedIndex].text;")
})