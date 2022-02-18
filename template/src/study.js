/*************************************************************
* test.js
*
* Main experiment file for the LITW Wikipedia Images study.
*
* Author: Maria Tracy
* Template code authors: Trevor Croxson & Nigini A. Oliveira
*
* Last Modified: August 13, 2020
*
* © Copyright 2020 LabintheWild.
* For questions about this file and permission to use
* the code, contact us at info@labinthewild.org
*************************************************************/

// load webpack modules
window.$ = window.jQuery = require("jquery");
require("bootstrap");
require("jquery-ui-bundle");
var LITW_STUDY_CONTENT = require("./data");
var Handlebars = require('handlebars/runtime')['default'];
var irbTemplate = require("../templates/irb.html");
var imageAndArticleTemplate = require("../templates/imageAndArticle.html")
var knowledgeQTemplate = require("../templates/knowledgeQ.html");
var questionZeroTemplate = require("../templates/questionZero.html");
var nonVisualQuestionTemplate = require("../templates/nonVisualQuestion.html")
var visualQuestionTemplate = require("../templates/visualQuestion.html")
var imageQuestionTemplate = require("../templates/imageQuestion.html")
var finalResultsTemplate = require("../templates/resultScore.html")
var loadingTemplate = require("../templates/loading.html");
var progressTemplate = require("../templates/progress.html");
var funFact = require("../templates/funFact.html");
var i18n = require("../js/i18n");
require("./jspsych-display-info");
require("./jspsych-display-slide");

module.exports = (function() {

  Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a === b) {
        return opts.fn(this);
    } else {
        return opts.inverse(this);
    }
  });

  window.litwWithTouch = false;

  var timeline = [],
  self = this,
  C,
  params = {
    wikiArticleSamples: [],
    questions: [],
    currentProgress: 0
  },

  // Show Informed Consent Form
  irb = function() {
    LITW.tracking.recordCheckpoint("irb");
    $("#irb").html(irbTemplate());
    $("#irb").i18n();
    LITW.utils.showSlide("irb");
    $("#agree-to-study").on("click", function() {
      if ($(this).prop("checked")) {
        LITW.utils.showNextButton(startTrials);
        $("#approve-irb").hide();
      } else {
        LITW.utils.hideNextButton();
        $("#approve-irb").show();
      }
      var sBrowser = null

      // collection user information
      var sUsrAg = navigator.userAgent;

      if (sUsrAg.indexOf("Firefox") > -1) {
        sBrowser = "Mozilla Firefox";
        // "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0"
      } else if (sUsrAg.indexOf("Opera") > -1 || sUsrAg.indexOf("OPR") > -1) {
        sBrowser = "Opera";
        //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 OPR/57.0.3098.106"
      } else if (sUsrAg.indexOf("Trident") > -1) {
        sBrowser = "Microsoft Internet Explorer";
        // "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; .NET4.0C; .NET4.0E; Zoom 3.6.0; wbx 1.0.0; rv:11.0) like Gecko"
      } else if (sUsrAg.indexOf("Edge") > -1) {
        sBrowser = "Microsoft Edge";
        // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299"
      } else if (sUsrAg.indexOf("Chrome") > -1) {
        sBrowser = "Google Chrome or Chromium";
        // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36"
      } else if (sUsrAg.indexOf("Safari") > -1) {
        sBrowser = "Apple Safari";
        // "Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1 980x1306"
      } else {
        sBrowser = "unknown";
      }
      //that is what we want to submit! - try to separate device/browser
      var start = new Date().getTime()
      jsPsych.data.addProperties({studyStartTime: start});
      jsPsych.data.addProperties({userBrowser: sBrowser});
      jsPsych.data.addProperties({userDeviceSm: navigator.userAgent.substr(navigator.userAgent.indexOf('('), navigator.userAgent.indexOf(';'))});
      jsPsych.data.addProperties({mobile: /Mobi|Android/i.test(navigator.userAgent)});
      jsPsych.data.addProperties({prevPID: LITW.data.getURLparams()});
      uuid = LITW.data.getParticipantId();
      prevPID = LITW.data.getURLparams()["LITW_PID"]
      LITW.data.submitStudyData({
        irbComplete: true,
        studyStartTime: start,
        userBrowser: sBrowser,
        userDeviceSm: navigator.userAgent.substr(navigator.userAgent.indexOf('('), navigator.userAgent.indexOf(';')),
        mobile: /Mobi|Android/i.test(navigator.userAgent),
        prevPID: prevPID,
        uuid: uuid
      });
    });
  },

  // Show Demographics Questionnaire
  demographics = function() {
    LITW.tracking.recordCheckpoint("demographics");
    LITW.forms.newForm("demographics", {
      autocomplete: true
    })
    .add("retake", {
      required: true
    })
    .add("country")
    .add("language")
    .add("proficiency")
    .add("age", {
      style: "numericalFreeText",
      prompt: "How old are you? (Please type a number)",
      boundsMessage: "Are you really %s years old? If not, please make sure to enter the correct age so that your data contributes to our research.",
      minValue: 6,
      maxValue: 99
    })
    .add("gender")
    .add("education")
    .render(comments)

    LITW.utils.showSlide("demographics");
    $(".last_button").css("visibility", "visible")
  },

  initJsPsych = function() {
    // ******* BEGIN STUDY PROGRESSION ******** //

    // A few articles for results page

    // shuffle given fun facts
    funFacts = LITW.utils.shuffleArrays(params.funFacts);

    // grab two fun facts for study;
    var funFactOne = funFacts[0][1];
    var funFactTwo = funFacts[1][1];
    
    // shuffle the given articles
    wikiArticles = LITW.utils.shuffleArrays(params.wikiArticleSamples);
    // grab the first three articles
    var article1 = wikiArticles[0][1];
    var article2 = wikiArticles[1][1];
    var article3 = wikiArticles[2][1];
    var article0 = wikiArticles[3][1];
    
    // get the page titles for all three articles
    var pageTitle1 = article1.pageTitle;
    var pageTitle2 = article2.pageTitle;
    var pageTitle3 = article3.pageTitle;
    var pageTitle0 = article0.pageTitle;

    // get the question objects for all three articles
    var qs0 = null;
    var qs1 = null;
    var qs2 = null;
    var qs3 = null;
    for (var j = 0; j < params.questions.length; j++){
      var arr = params.questions[j][1]
      if(arr.pageTitle == pageTitle1){
        qs1 = arr
      } else if (arr.pageTitle == pageTitle2) {
        qs2 = arr
      } else if (arr.pageTitle == pageTitle3) {
        qs3 = arr
      } else if (arr.pageTitle == pageTitle0) {
        qs0 = arr
      }
    }

    // get the original image width for all three articles
    var mainImageWidth1 = '230px';
    var mainImageWidth2 = '230px';
    var mainImageWidth3 = '230px';
    var mainImageWidth0 = '230px';
    for (var h = 0; h < params.widths.length; h++){
      var key = Object.entries(params.widths[h][1])[0][0]
      var value = Object.entries(params.widths[h][1])[0][1]
      if(key == pageTitle1){
        mainImageWidth1 = value + 'px'
      } else if (key == pageTitle2) {
        mainImageWidth2 = value + 'px'
      } else if (key == pageTitle3) {
        mainImageWidth3 = value + 'px'
      } else if (key == pageTitle0) {
        mainImageWidth0 = value + 'px'
      }
    }

    // get all the section titles for each article
    // so we can access necessary article text later on in the slides
    var secTitles1 = article1.sectionTitles.split(",");
    var secTitles2 = article2.sectionTitles.split(",");
    var secTitles3 = article3.sectionTitles.split(",");
    var allSectionTitles = [secTitles1, secTitles2, secTitles3]
    for(var l = 0; l < 3; l++) {
      for(var u = 0; u < allSectionTitles[l].length; u++){
        allSectionTitles[l][u] = allSectionTitles[l][u].trim()
      }
    }

    // retrieve and organize all section texts for each article,
    // and find the word count for each article,
    // this code assumes that there are at most four sections texts used
    // from the original wikipedia article
    var sectionTexts1 = [false, false, false, false];
    var sectionTexts2 = [false, false, false, false];
    var sectionTexts3 = [false, false, false, false];

    var wordCount1 = 0;
    var wordCount2 = 0;
    var wordCount3 = 0;

    var tempText = ""
    for(var p = 0; p < allSectionTitles[0].length; p++) {
      var text = article1[allSectionTitles[0][p]]
      sectionTexts1[p] = text
      tempText = tempText + " " + text
    }
    tempText = tempText.replace(/(^\s*)|(\s*$)/gi,"");
    tempText = tempText.replace(/[ ]{2,}/gi," ");
    tempText = tempText.replace(/\n /,"\n");
    wordCount1 = tempText.split(' ').length
    params.wordCount1 = wordCount1

    tempText = ""
    for(var c = 0; c < allSectionTitles[1].length; c++) {
      var text = article2[allSectionTitles[1][c]]
      sectionTexts2[c] = text
      tempText = tempText + " " + text
    }
    tempText = tempText.replace(/(^\s*)|(\s*$)/gi,"");
    tempText = tempText.replace(/[ ]{2,}/gi," ");
    tempText = tempText.replace(/\n /,"\n");
    wordCount2 = tempText.split(' ').length
    params.wordCount2 = wordCount2

    tempText = ""
    for(var a = 0; a < allSectionTitles[2].length; a++) {
      var text = article3[allSectionTitles[2][a]]
      sectionTexts3[a] = text
      tempText = tempText + " " + text
    }
    tempText = tempText.replace(/(^\s*)|(\s*$)/gi,"");
    tempText = tempText.replace(/[ ]{2,}/gi," ");
    tempText = tempText.replace(/\n /,"\n");
    wordCount3 = tempText.split(' ').length
    params.wordCount3 = wordCount3

    // randomly choosing to see if each article will have an image displayed or not
    var displayArticleImage1 = Math.random() < 0.5;
    var displayArticleImage2 = Math.random() < 0.5;
    var displayArticleImage3 = Math.random() < 0.5;


    // random selection of either the first or the second question included in the json for each visual
    // and non-visual
    var oneOrTwo = Math.random() < 0.5;
    var threeOrFour = Math.random() < 0.5;
    var visualPick1 = '3';
    var nonVisualPick1 = '1';
    if(oneOrTwo) {
      nonVisualPick1 = '2';
    }
    if(threeOrFour) {
      visualPick1 = '4';
    }
    oneOrTwo = Math.random() < 0.5;
    threeOrFour = Math.random() < 0.5;

    var visualPick2 = '3';
    var nonVisualPick2 = '1';
    if(oneOrTwo) {
      nonVisualPick2 = '2';
    }
    if(threeOrFour) {
      visualPick2 = '4';
    }

    oneOrTwo = Math.random() < 0.5;
    threeOrFour = Math.random() < 0.5;

    var visualPick3 = '3';
    var nonVisualPick3 = '1';
    if(oneOrTwo) {
      nonVisualPick3 = '2';
    }
    if(threeOrFour) {
      visualPick3 = '4';
    }

    oneOrTwo = Math.random() < 0.5;
    threeOrFour = Math.random() < 0.5;

    var visualPick0 = '3';
    var nonVisualPick0 = '1';
    if(oneOrTwo) {
      nonVisualPick0 = '2';
    }
    if(threeOrFour) {
      visualPick0 = '4';
    }

    // getting all the possible answers for each question type 
    // and combining them together in one array
    var distractorsNonVisualDraft1 = qs1["distractors" + nonVisualPick1].split(", ")
    distractorsNonVisualDraft1.push(qs1["answer" + nonVisualPick1])
    var distractorsVisualDraft1 = qs1["distractors" + visualPick1].split(", ")
    distractorsVisualDraft1.push(qs1["answer" + visualPick1])
    var distractorsImageDraft1 = [qs1.imageDistractor1, qs1.imageDistractor2, qs1.imageDistractor3, qs1.imageAnswerURL]

    var distractorsNonVisualDraft2 = qs2["distractors" + nonVisualPick2].split(", ")
    distractorsNonVisualDraft2.push(qs2["answer" + nonVisualPick2])
    var distractorsVisualDraft2 = qs2["distractors" + visualPick2].split(", ")
    distractorsVisualDraft2.push(qs2["answer" + visualPick2])
    var distractorsImageDraft2 = [qs2.imageDistractor1, qs2.imageDistractor2, qs2.imageDistractor3, qs2.imageAnswerURL]

    var distractorsNonVisualDraft3 = qs3["distractors" + nonVisualPick3].split(", ")
    distractorsNonVisualDraft3.push(qs3["answer" + nonVisualPick3])
    var distractorsVisualDraft3 = qs3["distractors" + visualPick3].split(", ")
    distractorsVisualDraft3.push(qs3["answer" + visualPick3])
    var distractorsImageDraft3 = [qs3.imageDistractor1, qs3.imageDistractor2, qs3.imageDistractor3, qs3.imageAnswerURL]

    var distractorsNonVisualDraft0 = qs0["distractors" + nonVisualPick0].split(", ");
    distractorsNonVisualDraft0.push(qs0["answer" + nonVisualPick0]);
    var distractorsVisualDraft0 = qs0["distractors" + visualPick0].split(", ");
    distractorsVisualDraft0.push(qs0["answer" + visualPick0]);
    var distractorsImageDraft0 = [qs0.imageDistractor1, qs0.imageDistractor2, qs0.imageDistractor3, qs0.imageAnswerURL]


    // randomizing the question answers
    function shuffle(a) {
      var j, x, i;
      for (i = a.length - 1; i > 0; i--) {
          j = Math.floor(Math.random() * (i + 1));
          x = a[i].trim();
          a[i] = a[j].trim();
          a[j] = x;
      }
      return a;
  }

  var distractorsNonVisual1 = shuffle(distractorsNonVisualDraft1)
  var distractorsVisual1 = shuffle(distractorsVisualDraft1)
  var distractorsImage1 = shuffle(distractorsImageDraft1)
  var distractorsNonVisual2 = shuffle(distractorsNonVisualDraft2)
  var distractorsVisual2 = shuffle(distractorsVisualDraft2)
  var distractorsImage2 = shuffle(distractorsImageDraft2)
  var distractorsNonVisual3 = shuffle(distractorsNonVisualDraft3)
  var distractorsVisual3 = shuffle(distractorsVisualDraft3)
  var distractorsImage3 = shuffle(distractorsImageDraft3)
  var distractorsNonVisual0 = shuffle(distractorsNonVisualDraft0)
  var distractorsVisual0 = shuffle(distractorsVisualDraft0)
  var distractorsImage0 = shuffle(distractorsImageDraft0)
  
  // getting the index of the right answer for each question for later use
  var actualIndexNonVisual1 = distractorsNonVisual1.indexOf(qs1["answer" + nonVisualPick1].trim())
  var actualIndexVisual1 = distractorsVisual1.indexOf(qs1["answer" + visualPick1].trim())

  var actualIndexNonVisual2 = distractorsNonVisual2.indexOf(qs2["answer" + nonVisualPick2].trim())
  var actualIndexVisual2 = distractorsVisual2.indexOf(qs2["answer" + visualPick2].trim())

  var actualIndexNonVisual3 = distractorsNonVisual3.indexOf(qs3["answer" + nonVisualPick3].trim())
  var actualIndexVisual3 = distractorsVisual3.indexOf(qs3["answer" + visualPick3].trim())

  var actualIndexNonVisual0 = distractorsNonVisual0.indexOf(qs0["answer" + nonVisualPick0].trim())
  var actualIndexVisual0 = distractorsVisual0.indexOf(qs0["answer" + visualPick0].trim())

  // progress counter 1
  timeline.push({
    type: "call-function",
    func: function() {
      $("#progress-header").html(progressTemplate({
        msg: C.progressMsg,
        progress: ++params.currentProgress,
        total: 18
      }))
      .show();
      LITW.utils.showSlide("trials");
    }
  });

  // 0) Question Zero

  timeline.push({
    type: "display-slide",
    display_element: $("#questionZero"),
    name: "questionZero",
    template: questionZeroTemplate({
      pageTitle: qs0.pageTitle,
      nonVisualQ: qs0["question" + nonVisualPick0],
      nonVisual1: distractorsNonVisual0[0],
      nonVisual2: distractorsNonVisual0[1],
      nonVisual3: distractorsNonVisual0[2],
      nonVisual4: distractorsNonVisual0[3],
      rightAnswerNonVisual: actualIndexNonVisual0,
      visualQ: qs0["question" + visualPick0],
      visual1: distractorsVisual0[0],
      visual2: distractorsVisual0[1],
      visual3: distractorsVisual0[2],
      visual4: distractorsVisual0[3],
      rightAnswerVisual: actualIndexVisual0,
      imageDistractor1: distractorsImage0[0],
      imageDistractor2: distractorsImage0[1],
      imageDistractor3: distractorsImage0[2],
      imageDistractor4: distractorsImage0[3],
      imageQuestion: qs0.imageQuestion,
      distractorWidth: mainImageWidth0,
      rightAnswerImage: qs0.imageAnswerURL
    }),
    finish: function() {
      jsPsych.data.addProperties({nonVisualQuestionZero: qs0["question" + nonVisualPick0]});
      jsPsych.data.addProperties({nonVisualQuestionZeroResponce: distractorsNonVisual0[parseInt($("input[name=nonVisual]:checked").val()) - 1]});
      var currentTime = new Date().getTime()
      jsPsych.data.addProperties({nonVisualQuestionZeroFinishTime: currentTime});
      // note if they got this question correct
      var testScoreNonVisual = 0
      var testScoreVisual = 0;
      var testScoreImage = 0
      if (distractorsNonVisual0[parseInt($("input[name=nonVisual]:checked").val()) - 1] == qs0["answer" + nonVisualPick0]) {
        testScoreNonVisual = 1
      } 
      jsPsych.data.addProperties({nonVisualQuestionZeroScore: testScoreNonVisual});
      jsPsych.data.addProperties({visualQuestionZero: qs0["question" + visualPick0]});
      jsPsych.data.addProperties({visualQuestionZeroResponce: distractorsVisual0[parseInt($("input[name=visual]:checked").val()) - 1]});
      
      if (distractorsVisual0[parseInt($("input[name=visual]:checked").val()) - 1] == qs0["answer" + visualPick0]) {
        testScoreVisual = 1
      } 
      jsPsych.data.addProperties({visualQuestionZeroScore: testScoreVisual});
      jsPsych.data.addProperties({imageQuestionZeroResponce: distractorsImage0[parseInt($("input[name=image]:checked").val()) - 1]});
      
      if ( distractorsImage0[parseInt($("input[name=image]:checked").val()) - 1] == qs0.imageAnswerURL) {
        testScoreImage = 1
      }
      jsPsych.data.addProperties({imageQuestionZeroScore: testScoreImage});
      jsPsych.data.addProperties({imageQuestionZero: qs0.imageQuestion});
      uuid = LITW.data.getParticipantId();
      LITW.data.submitStudyData({
        questionZeroComplete: true,
        imageQuestionZero: qs0.imageQuestion,
        imageQuestionZeroScore: testScoreImage,
        imageQuestionZeroResponce: distractorsImage0[parseInt($("input[name=image]:checked").val()) - 1],
        visualQuestionZeroScore: testScoreVisual,
        visualQuestionZeroResponce: distractorsVisual0[parseInt($("input[name=visual]:checked").val()) - 1],
        visualQuestionZero: qs0["question" + visualPick0],
        nonVisualQuestionZeroScore: testScoreNonVisual,
        nonVisualQuestionZeroFinishTime: currentTime,
        nonVisualQuestionZeroResponce: distractorsNonVisual0[parseInt($("input[name=nonVisual]:checked").val()) - 1],
        nonVisualQuestionZero: qs0["question" + nonVisualPick0],
        uuid: uuid
      });

    }
  });


    // progress counter 2
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();

        LITW.utils.showSlide("trials");
      }
    });

    // ARTICLE ONE

    // 1) Knowledge of article 1

    timeline.push({
      type: "display-slide",
      display_element: $("#knowledgeQ"),
      name: "knowledgeQuestion",
      template: knowledgeQTemplate({pageTitle: article1.pageTitle}),
      finish: function() {
        jsPsych.data.addProperties({mainImageWidth1: mainImageWidth1});
        jsPsych.data.addProperties({mainImageWidth2: mainImageWidth2});
        jsPsych.data.addProperties({mainImageWidth3: mainImageWidth3});
        jsPsych.data.addProperties({answersNonVisual1: distractorsNonVisual1});
        jsPsych.data.addProperties({answersNonVisual2: distractorsNonVisual2});
        jsPsych.data.addProperties({answersNonVisual3: distractorsNonVisual3});
        jsPsych.data.addProperties({answersVisual1: distractorsVisual1});
        jsPsych.data.addProperties({answersVisual2: distractorsVisual2});
        jsPsych.data.addProperties({answersVisual3: distractorsVisual3});
        jsPsych.data.addProperties({answersImage1: distractorsImage1});
        jsPsych.data.addProperties({answersImage2: distractorsImage2});
        jsPsych.data.addProperties({answersImage3: distractorsImage3});
        jsPsych.data.addProperties({knowledgeOfArticleOne: $("input[name=knowledge]:checked").val()});
        jsPsych.data.addProperties({titleOfArticleOne: article1.pageTitle});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({knowledgeOfArticleOneTime: currentTime});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          knowledgeOfArticleOneTime: currentTime, 
          knowledgeofArticleOneComplete: true,
          mainImageWidth1: mainImageWidth1,
          mainImageWidth2: mainImageWidth2,
          mainImageWidth3: mainImageWidth3,
          answersNonVisual1: distractorsNonVisual1,
          answersNonVisual2: distractorsNonVisual2,
          answersNonVisual3: distractorsNonVisual3,
          answersVisual1: distractorsVisual1,
          answersVisual2: distractorsVisual2,
          answersVisual3: distractorsVisual3,
          answersImage1: distractorsImage1,
          answersImage2: distractorsImage2,
          answersImage3: distractorsImage3,
          knowledgeOfArticleOne: $("input[name=knowledge]:checked").val(),
          titleOfArticleOne: article1.pageTitle,
          uuid: uuid
        });
      }
    });

    // progress counter 3
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //2) Show article one and possibly image (imageAndArticle.html)

    timeline.push({
      type: "display-slide",
      display_element: $("#imageAndArticle"),
      name: "imageAndArticle",
      template: imageAndArticleTemplate({
        pageTitle: article1.pageTitle,
        firstSection: sectionTexts1[0],
        secondSection: sectionTexts1[1],
        thirdSection: sectionTexts1[2],
        fourthSection: sectionTexts1[3],
        firstSectionTitle: allSectionTitles[0][0],
        secondSectionTitle: allSectionTitles[0][1],
        thirdSectionTitle: allSectionTitles[0][2],
        fourthSectionTitle: allSectionTitles[0][3],
        imageURL: qs1.imageURL,
        displayImage: displayArticleImage1,
        mainImageWidth: mainImageWidth1,
        four: sectionTexts1[3] ? true : false,
        three: sectionTexts1[2] ? true : false,
        two: sectionTexts1[1] ? true : false,
      }),
      finish: function() {
        jsPsych.data.addProperties({articleOneImageDisplayed: displayArticleImage1});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({articleOneFinishTime: currentTime});
        jsPsych.data.addProperties({articleOneWordCount: params.wordCount1})
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          articleOneComplete: true, 
          articleOneImageDisplayed: displayArticleImage1,
          articleOneFinishTime: currentTime,
          articleOneWordCount: params.wordCount1,
          uuid: uuid
        });
      }
    });

    // progress counter 4
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
        LITW.utils.showSlide("trials");
      }
    });

    //4) NonVisual Question

    timeline.push({
      type: "display-slide",
      display_element: $("#nonVisualQuestion"),
      name: "nonVisualQuestion",
      template: nonVisualQuestionTemplate({
        pageTitle: qs1.pageTitle,
        nonVisualQ: qs1["question" + nonVisualPick1],
        nonVisual1: distractorsNonVisual1[0],
        nonVisual2: distractorsNonVisual1[1],
        nonVisual3: distractorsNonVisual1[2],
        nonVisual4: distractorsNonVisual1[3],
        rightAnswer: actualIndexNonVisual1
      }),
      finish: function() {
        jsPsych.data.addProperties({nonVisualQuestionOne: qs1["question" + nonVisualPick1]});
        jsPsych.data.addProperties({nonVisualQuestionOneResponce: distractorsNonVisual1[parseInt($("input[name=nonVisual]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({nonVisualQuestionOneFinishTime: currentTime});
        var testScore = 0
        if (distractorsNonVisual1[parseInt($("input[name=nonVisual]:checked").val()) - 1] == qs1["answer" + nonVisualPick1]) {
          testScore = 1
        } 
        jsPsych.data.addProperties({nonVisualQuestionOneScore: testScore});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          nonVisualQuestionOneComplete: true, 
          nonVisualQuestionOne: qs1["question" + nonVisualPick1],
          nonVisualQuestionOneResponce: distractorsNonVisual1[parseInt($("input[name=nonVisual]:checked").val()) - 1],
          nonVisualQuestionOneFinishTime: currentTime,
          nonVisualQuestionOneScore: testScore,
          uuid: uuid
        });
      }
    });

    // progress counter 5
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //5) Visual Question

    timeline.push({
      type: "display-slide",
      display_element: $("#visualQuestion"),
      name: "visualQuestion",
      template: visualQuestionTemplate({
        pageTitle: qs1.pageTitle,
        visualQ: qs1["question" + visualPick1] ,
        visual1: distractorsVisual1[0],
        visual2: distractorsVisual1[1],
        visual3: distractorsVisual1[2],
        visual4: distractorsVisual1[3],
        rightAnswer: actualIndexVisual1
      }),
      finish: function() {
        jsPsych.data.addProperties({visualQuestionOne: qs1["question" + visualPick1]});
        jsPsych.data.addProperties({visualQuestionOneResponce: distractorsVisual1[parseInt($("input[name=visual]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({visualQuestionOneFinishTime: currentTime});
        var testScore = 0
        if (distractorsVisual1[parseInt($("input[name=visual]:checked").val()) - 1] == qs1["answer" + nonVisualPick1]) {
          testScore = 1
        } 
        jsPsych.data.addProperties({visualQuestionOneScore: testScore});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          visualQuestionOneComplete: true, 
          visualQuestionOne: qs1["question" + visualPick1],
          visualQuestionOneResponce: distractorsVisual1[parseInt($("input[name=visual]:checked").val()) - 1],
          visualQuestionOneFinishTime: currentTime,
          visualQuestionOneScore: testScore,
          uuid: uuid
        });
      }
    });

    // progress counter 6
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //6) Image Question
    jsPsych.data.addProperties({distractorsImage1: distractorsImage1});
    timeline.push({
      type: "display-slide",
      display_element: $("#imageQuestion"),
      name: "imageQuestion",
      template: imageQuestionTemplate({
        imageDistractor1: distractorsImage1[0],
        imageDistractor2: distractorsImage1[1],
        imageDistractor3: distractorsImage1[2],
        imageDistractor4: distractorsImage1[3],
        imageQuestion: qs1.imageQuestion,
        pageTitle: qs1.pageTitle,
        distractorWidth: mainImageWidth1,
        rightAnswer: qs1.imageAnswerURL
      }),
      finish: function() {
        jsPsych.data.addProperties({imageQuestionOneResponce: distractorsImage1[parseInt($("input[name=image]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({imageQuestionOneFinishTime: currentTime});
        var testScore = 0
        if ( distractorsImage1[parseInt($("input[name=image]:checked").val()) - 1] == qs1.imageAnswerURL) {
          testScore = 1
        }
        jsPsych.data.addProperties({imageQuestionOneScore: testScore});
        jsPsych.data.addProperties({imageQuestionOne: qs1.imageQuestion});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          imagelQuestionOneComplete: true, 
          imageQuestionOneResponce: distractorsImage1[parseInt($("input[name=image]:checked").val()) - 1],
          imageQuestionOneFinishTime: currentTime,
          imageQuestionOneScore: testScore,
          imageQuestionOne: qs1.imageQuestion,
          uuid: uuid
        });
      }
    });

    // progress counter 7
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    // Fun Fact #1
    timeline.push({
      type: "display-slide",
      display_element: $("#funFact"),
      name: "funFact",
      template: funFact({funFact: funFactOne}),
      finish: function() {
        jsPsych.data.addProperties({funFactOne: funFactOne});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({funFactOneFinishTime: currentTime});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          funFactOneComplete: true, 
          funFactOne: funFactOne,
          funFactOneFinishTime: currentTime,
          uuid: uuid
        });
      }
    });

    // progress counter 8
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });


    // ARTICLE TWO

    // 1) Knowledge of article 2
    
    timeline.push({
      type: "display-slide",
      display_element: $("#knowledgeQ"),
      name: "knowledgeQuestion",
      template: knowledgeQTemplate({pageTitle: article2.pageTitle}),
      finish: function() {
        // push knowledgeQuestion responce
        jsPsych.data.addProperties({knowledgeOfArticleTwo: $("input[name=knowledge]:checked").val()});
        // push title of article used as the first article
        jsPsych.data.addProperties({titleOfArticleTwo: article2.pageTitle});
        // record finish time on this slide
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({knowledgeOfArticleTwoTime: currentTime});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          knowledgeOfArticleTwoComplete: true, 
          pageTitle: article2.pageTitle,
          knowledgeOfArticleTwo: $("input[name=knowledge]:checked").val(),
          titleOfArticleTwo: article2.pageTitle,
          knowledgeOfArticleTwoTime: currentTime,
          uuid: uuid
        });
      }
    });

    // progress counter 9
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //2) Show article one and possibly image (imageAndArticle.html)

    timeline.push({
      type: "display-slide",
      display_element: $("#imageAndArticle"),
      name: "imageAndArticle",
      template: imageAndArticleTemplate({
        pageTitle: article2.pageTitle,
        firstSection: sectionTexts2[0],
        secondSection: sectionTexts2[1],
        thirdSection: sectionTexts2[2],
        fourthSection: sectionTexts2[3],
        firstSectionTitle: allSectionTitles[1][0],
        secondSectionTitle: allSectionTitles[1][1],
        thirdSectionTitle: allSectionTitles[1][2],
        fourthSectionTitle: allSectionTitles[1][3],
        imageURL: qs2.imageURL,
        displayImage: displayArticleImage2,
        mainImageWidth: mainImageWidth2,
        four: sectionTexts2[3] ? true : false,
        three: sectionTexts2[2] ? true : false,
        two: sectionTexts2[1] ? true : false,
      }),
      finish: function() {
        jsPsych.data.addProperties({articleTwoImageDisplayed: displayArticleImage2})
        // note the time stamp of when they finished this slide
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({articleTwoFinishTime: currentTime});
        jsPsych.data.addProperties({articleTwoWordCount: params.wordCount2})
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          articleTwoComplete: true, 
          articleTwoImageDisplayed: displayArticleImage2,
          articleTwoFinishTime: currentTime,
          articleTwoWordCount: params.wordCount2,
          uuid: uuid
        });
      }
    });

    // progress counter 10
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
        LITW.utils.showSlide("trials");
      }
    });

    //4) NonVisual Question

    timeline.push({
      type: "display-slide",
      display_element: $("#nonVisualQuestion"),
      name: "nonVisualQuestion",
      template: nonVisualQuestionTemplate({
        pageTitle: qs2.pageTitle,
        nonVisualQ: qs2["question" + nonVisualPick2],
        nonVisual1: distractorsNonVisual2[0],
        nonVisual2: distractorsNonVisual2[1],
        nonVisual3: distractorsNonVisual2[2],
        nonVisual4: distractorsNonVisual2[3],
        rightAnswer: actualIndexNonVisual2
      }),
      finish: function() {
        jsPsych.data.addProperties({nonVisualQuestionTwo: qs2["question" + nonVisualPick2]});
        // note the given responce for non visual question for article one
        jsPsych.data.addProperties({nonVisualQuestionTwoResponce: distractorsNonVisual2[parseInt($("input[name=nonVisual]:checked").val()) - 1]});
        // note the time when they finished this slide
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({nonVisualQuestionTwoFinishTime: currentTime});
        // note if they got this question correct
        var testScore = 0
        if (distractorsNonVisual2[parseInt($("input[name=nonVisual]:checked").val()) - 1] == qs2["answer" + nonVisualPick2]) {
          testScore = 1
        } 
        jsPsych.data.addProperties({nonVisualQuestionTwoScore: testScore});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          nonVisualQuestionTwoComplete: true, 
          nonVisualQuestionTwo: qs2["question" + nonVisualPick2],
          nonVisualQuestionTwoResponce: distractorsNonVisual2[parseInt($("input[name=nonVisual]:checked").val()) - 1],
          nonVisualQuestionTwoFinishTime: currentTime,
          nonVisualQuestionTwoScore: testScore,
          uuid: uuid
        });
      }
    });

    // progress counter 11
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //5) Visual Question

    timeline.push({
      type: "display-slide",
      display_element: $("#visualQuestion"),
      name: "visualQuestion",
      template: visualQuestionTemplate({
        pageTitle: qs2.pageTitle,
        visualQ: qs2["question" + visualPick2] ,
        visual1: distractorsVisual2[0],
        visual2: distractorsVisual2[1],
        visual3: distractorsVisual2[2],
        visual4: distractorsVisual2[3],
        rightAnswer: actualIndexVisual2
      }),
      finish: function() {
        jsPsych.data.addProperties({visualQuestionTwo: qs2["question" + visualPick2]});
        jsPsych.data.addProperties({visualQuestionTwoResponce: distractorsVisual2[parseInt($("input[name=visual]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({visualQuestionTwoFinishTime: currentTime});
        var testScore = 0
        if (distractorsVisual2[parseInt($("input[name=visual]:checked").val()) - 1] == qs2["answer" + nonVisualPick2]) {
          testScore = 1
        } 
        jsPsych.data.addProperties({visualQuestionTwoScore: testScore});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          visualQuestionTwoComplete: true, 
          visualQuestionTwo: qs2["question" + visualPick2],
          visualQuestionTwoResponce: distractorsVisual2[parseInt($("input[name=visual]:checked").val()) - 1],
          visualQuestionTwoFinishTime: currentTime,
          visualQuestionTwoScore: testScore,
          uuid: uuid
        });
      }
    });

    // progress counter 12
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //6) Image Question

    timeline.push({
      type: "display-slide",
      display_element: $("#imageQuestion"),
      name: "imageQuestion",
      template: imageQuestionTemplate({
        imageDistractor1: distractorsImage2[0],
        imageDistractor2: distractorsImage2[1],
        imageDistractor3: distractorsImage2[2],
        imageDistractor4: distractorsImage2[3],
        imageQuestion: qs2.imageQuestion,
        pageTitle: qs2.pageTitle,
        distractorWidth: mainImageWidth2,
        rightAnswer: qs2.imageAnswerURL
      }),
      finish: function() {
        jsPsych.data.addProperties({imageQuestionTwoResponce: distractorsImage2[parseInt($("input[name=image]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({imageQuestionTwoFinishTime: currentTime});
        var testScore = 0
        if (distractorsImage2[parseInt($("input[name=image]:checked").val()) - 1] == qs2.imageAnswerURL) {
          testScore = 1
        }
        jsPsych.data.addProperties({imageQuestionTwoScore: testScore});
        jsPsych.data.addProperties({imageQuestionTwo: qs2.imageQuestion});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          imageQuestionTwoComplete: true, 
          imageQuestionTwoResponce: distractorsImage2[parseInt($("input[name=image]:checked").val()) - 1],
          imageQuestionTwoFinishTime: currentTime,
          imageQuestionTwoScore: testScore,
          imageQuestionTwo: qs2.imageQuestion,
          uuid: uuid
        });
      }
    });

    // progress counter 13
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    // Fun Fact #2
    timeline.push({
      type: "display-slide",
      display_element: $("#funFact"),
      name: "funFact",
      template: funFact({funFact: funFactTwo}),
      finish: function() {
        jsPsych.data.addProperties({funFactTwo: funFactTwo});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({funFactTwoFinishTime: currentTime});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          funFactTwoComplete: true, 
          funFactTwo: funFactTwo,
          funFactTwoFinishTime: currentTime,
          uuid: uuid
        });
      }
    });

    // progress counter 14
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    // ARTICLE THREE

    // 1) Knowledge of article 3
    
    timeline.push({
      type: "display-slide",
      display_element: $("#knowledgeQ"),
      name: "knowledgeQuestion",
      template: knowledgeQTemplate({pageTitle: article3.pageTitle}),
      finish: function() {
        // push knowledgeQuestion responce
        jsPsych.data.addProperties({knowledgeOfArticleThree: $("input[name=knowledge]:checked").val()});
        // push title of article used as the first article
        jsPsych.data.addProperties({titleOfArticleThree: article3.pageTitle});
        // record finish time on this slide
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({knowledgeOfArticleThreeTime: currentTime});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          knowledgeOfArticleThreeComplete: true, 
          knowledgeOfArticleThree: $("input[name=knowledge]:checked").val(),
          titleOfArticleThree: article3.pageTitle,
          knowledgeOfArticleThreeTime: currentTime,
          uuid: uuid
        });
      }
    });

    // progress counter 15
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //2) Show article one and possibly image (imageAndArticle.html)

    timeline.push({
      type: "display-slide",
      display_element: $("#imageAndArticle"),
      name: "imageAndArticle",
      template: imageAndArticleTemplate({
        pageTitle: article3.pageTitle,
        firstSection: sectionTexts3[0],
        secondSection: sectionTexts3[1],
        thirdSection: sectionTexts3[2],
        fourthSection: sectionTexts3[3],
        firstSectionTitle: allSectionTitles[2][0],
        secondSectionTitle: allSectionTitles[2][1],
        thirdSectionTitle: allSectionTitles[2][2],
        fourthSectionTitle: allSectionTitles[2][3],
        imageURL: qs3.imageURL,
        displayImage: displayArticleImage3,
        mainImageWidth: mainImageWidth3,
        four: sectionTexts3[3] ? true : false,
        three: sectionTexts3[2] ? true : false,
        two: sectionTexts3[1] ? true : false,
      }),
      finish: function() {
        // note if image was displayed for article one
        jsPsych.data.addProperties({articleThreeImageDisplayed: displayArticleImage3});
        // note the time stamp of when they finished this slide
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({articleThreeFinishTime: currentTime});
        jsPsych.data.addProperties({articleThreeWordCount: params.wordCount3})
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          articleThreeComplete: true, 
          articleThreeImageDisplayed: displayArticleImage3,
          articleThreeFinishTime: currentTime,
          articleThreeWordCount: params.wordCount3,
          uuid: uuid
        });
      }
    });

    // progress counter 16
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
        LITW.utils.showSlide("trials");
      }
    });

    //4) NonVisual Question

    timeline.push({
      type: "display-slide",
      display_element: $("#nonVisualQuestion"),
      name: "nonVisualQuestion",
      template: nonVisualQuestionTemplate({
        pageTitle: qs3.pageTitle,
        nonVisualQ: qs3["question" + nonVisualPick3],
        nonVisual1: distractorsNonVisual3[0],
        nonVisual2: distractorsNonVisual3[1],
        nonVisual3: distractorsNonVisual3[2],
        nonVisual4: distractorsNonVisual3[3],
        rightAnswer: actualIndexNonVisual3
      }),
      finish: function() {
        jsPsych.data.addProperties({nonVisualQuestionThree: qs3["question" + nonVisualPick3]});
        // note the given responce for non visual question for article one
        jsPsych.data.addProperties({nonVisualQuestionThreeResponce: distractorsNonVisual3[parseInt($("input[name=nonVisual]:checked").val()) - 1]});
        // note the time when they finished this slide
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({nonVisualQuestionThreeFinishTime: currentTime});
        // note if they got this question correct
        var testScore = 0
        if (distractorsNonVisual3[parseInt($("input[name=nonVisual]:checked").val()) - 1] == qs3["answer" + nonVisualPick3]) {
          testScore = 1
        } 
        jsPsych.data.addProperties({nonVisualQuestionThreeScore: testScore});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          nonVisualQuestionThreeComplete: true, 
          nonVisualQuestionThree: qs3["question" + nonVisualPick3],
          nonVisualQuestionThreeResponce: distractorsNonVisual3[parseInt($("input[name=nonVisual]:checked").val()) - 1],
          nonVisualQuestionThreeFinishTime: currentTime,
          nonVisualQuestionThreeScore: testScore,
          uuid: uuid
        });
      }
    });

    // progress counter 17
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //5) Visual Question

    timeline.push({
      type: "display-slide",
      display_element: $("#visualQuestion"),
      name: "visualQuestion",
      template: visualQuestionTemplate({
        pageTitle: qs3.pageTitle,
        visualQ:  qs3["question" + visualPick3],
        visual1: distractorsVisual3[0],
        visual2: distractorsVisual3[1],
        visual3: distractorsVisual3[2],
        visual4: distractorsVisual3[3],
        rightAnswer: actualIndexVisual3
      }),
      finish: function() {
        jsPsych.data.addProperties({visualQuestionThree: qs3["question" + visualPick3]});
        jsPsych.data.addProperties({visualQuestionThreeResponce: distractorsVisual3[parseInt($("input[name=visual]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({visualQuestionThreeFinishTime: currentTime});
        var testScore = 0
        if ( distractorsVisual3[parseInt($("input[name=visual]:checked").val()) - 1] == qs3["answer" + visualPick3]) {
          testScore = 1
        } 
        jsPsych.data.addProperties({visualQuestionThreeScore: testScore});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          visualQuestionThreeComplete: true, 
          visualQuestionThree: qs3["question" + visualPick3],
          visualQuestionThreeResponce: distractorsVisual3[parseInt($("input[name=visual]:checked").val()) - 1],
          visualQuestionThreeFinishTime: currentTime,
          visualQuestionThreeScore: testScore,
          uuid: uuid
        });
      }
    });

    // progress counter 18
    timeline.push({
      type: "call-function",
      func: function() {
        $("#progress-header").html(progressTemplate({
          msg: C.progressMsg,
          progress: ++params.currentProgress,
          total: 18
        }))
        .show();
      }
    });

    //6) Image Question

    timeline.push({
      type: "display-slide",
      display_element: $("#imageQuestion"),
      name: "imageQuestion",
      template: imageQuestionTemplate({
        imageDistractor1: distractorsImage3[0],
        imageDistractor2: distractorsImage3[1],
        imageDistractor3: distractorsImage3[2],
        imageDistractor4: distractorsImage3[3],
        imageQuestion: qs3.imageQuestion,
        pageTitle: qs3.pageTitle,
        distractorWidth: mainImageWidth3,
        rightAnswer: qs3.imageAnswerURL
      }),
      finish: function() {
        jsPsych.data.addProperties({imageQuestionThreeResponce: distractorsImage3[parseInt($("input[name=image]:checked").val()) - 1]});
        var currentTime = new Date().getTime()
        jsPsych.data.addProperties({imageQuestionThreeFinishTime: currentTime});
        var testScore = 0
        if (distractorsImage3[parseInt($("input[name=image]:checked").val()) - 1] == qs3.imageAnswerURL) {
          testScore = 1
        }
        jsPsych.data.addProperties({imageQuestionThreeScore: testScore});
        jsPsych.data.addProperties({imageQuestionThree: qs3.imageQuestion});
        var studyData1 = jsPsych.data.getLastTrialData()
        var articleOneTimeSec = (studyData1.articleOneFinishTime - studyData1.knowledgeOfArticleOneTime) / 1000
        var articleTwoTimeSec = (studyData1.articleTwoFinishTime - studyData1.knowledgeOfArticleTwoTime) / 1000
        var articleThreeTimeSec = (studyData1.articleThreeFinishTime - studyData1.knowledgeOfArticleThreeTime) / 1000 
        var articleReadTimeTotalSec = articleOneTimeSec + articleTwoTimeSec + articleThreeTimeSec
        var words = studyData1.articleTwoWordCount + studyData1.articleOneWordCount + studyData1.articleThreeWordCount  
        var surveyTotalTime = (currentTime - studyData1.studyStartTime)
        surveyTotalTime = ((surveyTotalTime / 1000 ) / 60)
        surveyTotalTime = Math.round(surveyTotalTime * 10) / 10
        var totalScore = studyData1.imageQuestionThreeScore + studyData1.imageQuestionTwoScore  + studyData1.imageQuestionOneScore + studyData1.visualQuestionOneScore + studyData1.visualQuestionThreeScore + studyData1.visualQuestionTwoScore + studyData1.nonVisualQuestionThreeScore + studyData1.nonVisualQuestionTwoScore + studyData1.nonVisualQuestionOneScore
        jsPsych.data.addProperties({'articleTimeTotal': articleReadTimeTotalSec});
        jsPsych.data.addProperties({'surveyTimeTotal': surveyTotalTime});
        jsPsych.data.addProperties({'totalScore': totalScore});
        jsPsych.data.addProperties({'totalWords': words});
        uuid = LITW.data.getParticipantId();
        LITW.data.submitStudyData({
          imageQuestionThreeComplete: true, 
          visualQuestionThree: qs3["question" + visualPick3],
          imageQuestionThreeResponce: distractorsImage3[parseInt($("input[name=image]:checked").val()) - 1],
          imageQuestionThreeFinishTime: currentTime,
          imageQuestionThreeScore: testScore,
          imageQuestionThree: qs3.imageQuestion,
          articleTimeTotal: articleReadTimeTotalSec,
          surveyTimeTotal: surveyTotalTime,
          totalScore: totalScore,
          totalWords: words,
          uuid: uuid
        });
      }
    });

    // record tracking information
    timeline.push({
      type: "call-function",
      func: function() {
        LITW.utils.showSlide("trials");
      }
    });

    // register a function to submit data as soon
    // as this trial is completed
    timeline.push({
      type: "call-function",
      func: submitData
    });

    // ******* END STUDY PROGRESSION ******** //
  },

  submitData = function() {
    LITW.data.submitStudyData(jsPsych.data.getLastTrialData());
  },

  startTrials = function() {
    LITW.utils.showSlide("trials");
    jsPsych.init({
      timeline: timeline,
      on_finish: demographics,
      display_element: $("#trials")
    });
  },

  comments = function(demographicsData) {
    // send demographics data to the server
    LITW.data.submitDemographics(demographicsData);

    $("#progress-header").hide();
    LITW.utils.showSlide("comments");
    LITW.comments.showCommentsPage(results);
  },

  results = function(commentsData) {

    LITW.data.submitComments(commentsData);

    var studyData1 = jsPsych.data.getLastTrialData()
    console.log(studyData1)
    var words = studyData1.totalWords

    var totalScore = studyData1.totalScore
    
  
    var amount = (words * 100) / 3800000000 
    var max = amount.toString().length - 2
    if (max > 8) {
      max = 10
    }
    var number = amount.toString().substring(2,max)
    var result = number;

    var scoreVal = Math.max(totalScore - 2.25, 0);
    var timeOneV = studyData1.nonVisualQuestionOneFinishTime - studyData1.articleOneFinishTime
    var timeOneNV = studyData1.visualQuestionOneFinishTime - studyData1.nonVisualQuestionOneFinishTime
    var timeOneImg = studyData1.imageQuestionOneFinishTime - studyData1.visualQuestionOneFinishTime
    var timeTwoV = studyData1.nonVisualQuestionTwoFinishTime - studyData1.articleTwoFinishTime
    var timeTwoNV = studyData1.visualQuestionTwoFinishTime - studyData1.nonVisualQuestionTwoFinishTime
    var timeTwoImg = studyData1.imageQuestionTwoFinishTime - studyData1.visualQuestionTwoFinishTime
    var timeThreeV = studyData1.nonVisualQuestionThreeFinishTime - studyData1.articleThreeFinishTime
    var timeThreeNV = studyData1.visualQuestionThreeFinishTime - studyData1.nonVisualQuestionThreeFinishTime
    var timeThreeImg = studyData1.imageQuestionThreeFinishTime - studyData1.visualQuestionThreeFinishTime
    var totalT = timeOneV + timeOneNV + timeOneImg + timeTwoV + timeTwoNV + timeTwoImg + timeThreeV + timeThreeNV + timeThreeImg;
    var avgTimePerQ = (totalT / 9) / 1000;
    var n = avgTimePerQ / 5;
    var n6 = 1 + Math.exp(n - 6);
    var timeVal = Math.max((60/n6), 0);
    var resultScore = Math.round((scoreVal*timeVal) + (totalScore*5));

    var quote = "";
    if (resultScore > 400) {
      quote = "You should be a Wiki Editor!";
    } else if (resultScore > 320) {
      quote = "You have gone above and beyond!";
    } else if (resultScore > 240) {
      quote = "You totally nailed it!";
    } else if (resultScore > 160) {
      quote = "Awesome!";
    } else if (resultScore > 80) {
      quote = "Way to go!";
    } else if (resultScore > 50) {
      quote = "Well done!";
    } else if (resultScore > 15) {
      quote = "You did it!";
    } else {
      quote = "Maybe you will do better next time!";
    } 

    if(resultScore == 0) {
      resultScore = 5
    }

    var resultString = "https://www.labinthewild.org/studies/wikipedia/wikiscore/wikiscore-" + resultScore + ".png";
    
    var avgResultScore = Math.round(params.summary.avg_result_score);

    pid = LITW.data.getParticipantId()
    twitterText = "I got a WikiKnowledgeScore of " + resultScore + "! See what score you can get and maybe you'll learn something new!"
    LITW.utils.showSlide("results");
    $("#results").html(finalResultsTemplate({
      avgResultScore: avgResultScore,
      quote: quote,
      articleOne: studyData1.titleOfArticleOne,
      articleTwo: studyData1.titleOfArticleTwo,
      articleThree: studyData1.titleOfArticleThree,
      percentage: "0." + result,
      resultScore: resultString,
      id: pid,
    }));
    LITW.results.insertFooter(twitterText);
  };

  summaryInitialData = function(json_data){
    var summary = {};
    for (count in json_data) {
      var country = json_data[count].country;
      if( country in summary){
        summary[country] = summary[country]+1;
      } else {
        summary[country] = 1;
      }
    };
    var data = {summary : true};
    data.data = summary;
    LITW.data.submitStudyData(data);
  }

  readSummaryData = function(obj) {
    $.ajax({
      url: "summary.json",
      dataType: "json",
      async: false,
      success: function(data){
        obj["summary"] = data
      }
    })
  }

  loadNeededData = function (params) {
    // load wikipedia articles available
    wikiArticles = [];
    // load wikiArticles array with WikipediaArticles.json data
    $.ajax({
      url: "WikipediaArticles.json",
      dataType: "json",
      async: false,
      success: function(data){
        for (var i in data) {
          wikiArticles.push([i, data[i]]);
        }
      }
    })
    articleQuestions = []
    $.ajax({
      url: "WorldKnowledgeQs.json",
      dataType: "json",
      async: false,
      success: function(data){
        for (var i in data) {
          articleQuestions.push([i, data[i]]);
        }
      }
    })

    imageWidths = []
    $.ajax({
      url: "ArticleImageWidths.json",
      dataType: "json",
      async: false,
      success: function(data){
        for (var j in data) {
          imageWidths.push([j, data[j]]);
        }
      }
    })
    funFacts = []
    $.ajax({
      url: "facts.json",
      dataType: "json",
      async: false,
      success: function(data){
        for (var i in data) {
          funFacts.push([i, data[i]]);
        }
      }
    })

    params.wikiArticleSamples = wikiArticles;
    params.questions = articleQuestions;
    params.widths = imageWidths;
    params.funFacts = funFacts;
    params.randomArticles = [
      {
        url: "https://en.wikipedia.org/wiki/Tardigrade",
        img: "https://upload.wikimedia.org/wikipedia/commons/0/09/201703_tardigrade.svg",
        title: "Tardigrade"
      },
      {
        url: "https://en.wikipedia.org/wiki/Colors_of_noise",
        img: "https://upload.wikimedia.org/wikipedia/commons/6/6c/The_Colors_of_Noise.png",
        title: "Colors of noise"
      },
      {
        url: "https://en.wikipedia.org/wiki/Buttered_cat_paradox",
        img: "https://upload.wikimedia.org/wikipedia/commons/2/20/Buttered_cat.png",
        title: "Buttered cat paradox"
      }
    ]
  }

  // when the page is loaded, start the study!
  $(document).ready(function() {

    // detect touch devices
    window.litwWithTouch = ("ontouchstart" in window);

    // determine and set the study language
    $.i18n().locale = i18n.getLocale();

    $.i18n().load(
      {
        'en': 'src/i18n/en.json',
        'pt-BR': 'src/i18n/pt-br.json'
      }
    ).done(
      function(){
        $('head').i18n();
        $('body').i18n();
      }
    );

    // generate unique participant id and geolocate participant
    LITW.data.initialize();
    LITW.share.makeButtons("#header-share", "What percentage of Wikipedia do you know?");

    // shortcut to access study content
    C = LITW_STUDY_CONTENT;

    loadNeededData(params);
    // get initial data from database (maybe needed for the results page!?)
    readSummaryData(params);

    // sample 3 pages from wikiArticles without replacement
    // and assign to params.wikiArticleSamples
    // samples = [];
    // samples = jsPsych.randomization.sample(wikiArticles, 3, false);
    // params.wikiArticleSamples = samples;

    LITW.utils.showSlide("img-loading");

    // 1. preload images
    // 2. initialize the jsPsych timeline and
    // 3. proceed to IRB page when loading has finished
    jsPsych.pluginAPI.preloadImages(
      ["img/btn-next.png","img/btn-next-active.png","img/ajax-loader.gif"],
      function() {
        initJsPsych();
        irb();
      },

      // update loading indicator as stims preload
      function(numLoaded) {
        $("#img-loading").html(loadingTemplate({
          msg: C.loadingMsg,
          numLoaded: numLoaded,
          total: 3
        }));
      }
    );
  });
})();