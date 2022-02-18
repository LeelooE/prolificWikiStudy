import csv
import webbrowser
import pandas as pd
from IPython.display import HTML
import random
import wikipediaapi
import sys

# given a .csv file, write the contents of specified row to html page
# if showImage == 't'/'T' or 'true'/'True', show displayImage before article.
def writeHtml(csvFile, row, showImage):
    row = int(row)
    # create pandas DataFrame from csv file
    # for more info on DataFrames, see https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.html
    df = pd.read_csv(csvFile)

    # grab items to display in imageAndArticle.html page
    pageTitle = df.iloc[row][0]
    sectionTitles = df.iloc[row][1]
    displayImage = df.iloc[row][2]
    writeImageAndArticleHtml(pageTitle, sectionTitles, displayImage, showImage)

    # grab images to display in imageQuestion.html page
    imageQuestion = df.iloc[row][15]
    imageAnswer = df.iloc[row][16]
    imageDistractor1 = df.iloc[row][17]
    imageDistractor2 = df.iloc[row][18]
    imageDistractor3 = df.iloc[row][19]
    imageDistractors = [imageDistractor1, imageDistractor2, imageDistractor3]
    writeImageQuestionHtml(imageQuestion, imageAnswer, imageDistractors)

    # grab items to display in Question.html pages
    for i in range(4):
        if(df.iloc[row][(i + 1) * 3] == ''):
            # there are < 4 questions
            break
        else:
            question = df.iloc[row][(i + 1) * 3]
            answer = df.iloc[row][((i + 1) * 3) + 1]
            distractors = (df.iloc[row][((i + 1) * 3) + 2]).split(",")
            writeQuestionHtml(question, answer, distractors, i)

# given page + section titles of Wikipedia article and url of image to display,
# retrieves summary and section text from Wiki article and writes imageAndArticle.html page
# if showImage == 't' or 'true' or 'True', show displayImage before article.
def writeImageAndArticleHtml(pageTitle, sectionTitles, displayImage, showImage):
    # get Wikipedia page using wikipedia-api
    # see https://pypi.org/project/Wikipedia-API/ for more info
    wiki_wiki = wikipediaapi.Wikipedia(
        language='en',
        extract_format=wikipediaapi.ExtractFormat.WIKI
    )
    wiki_page = wiki_wiki.page(pageTitle)

    # write html to display page title, image, and page summary
    htmlPage = 'imageAndArticle.html'
    f = open(htmlPage, 'w')

    opening = """<html>
    <head><link rel="stylesheet" type="text/css" href="style.css"></head>
    <body><h1>%s</h1>"""
    opening = opening % pageTitle.capitalize()

    if(showImage.lower() == 't' or showImage.lower() == 'true'):
        image = "<img src='%s' width='200' height='300'>"
        image = image % displayImage
        opening = opening + image

    wrapper = """<h2>Summary</h2>
                  <p>%s</p>"""
    wrapper = wrapper % wiki_page.summary

    # write html to display section titles and text
    for s in wiki_page.sections:
        if s.title in sectionTitles:
            section = "<h2>" + s.title + "</h2><p>" + s.text + "</p>"
            wrapper = wrapper + section

    # button to move on to questions after finished reading
    button = "<a href='question1.html'><button>Finished reading? Go to Questions</button></a>"
    closing = button + "</body></html>"
    whole = opening + wrapper + closing

    f.write(whole)
    f.close()

    filename = 'file:///Users/mullena/Documents/Maria/HCI Lab/Wikipedia Study/Sample/' + htmlPage
    webbrowser.open_new_tab(filename)

# given question, answer, and list of distractor answers, writes
# Question.html page with question followed by randomized list of answers
# and submit button
def writeQuestionHtml(question, answer, distractors, index):
    # randomize list of answers and strip out white space
    randomOptions = [x.strip(' ') for x in distractors]
    randomOptions.append(answer.strip(' '))
    random.shuffle(randomOptions)

    # write html page for one question
    htmlPage = 'question' + str(index + 1) + '.html'
    f = open(htmlPage, 'w')
    wrapper = """<html>
    <head><link rel="stylesheet" type="text/css" href="style.css"></head>
    <body>
        <h2>Question %s:</h2>
        <p>%s</p>"""
    wrapper = wrapper % (index + 1, question)

    # write radio button answers
    for i in range(len(randomOptions)):
        tag = """<div>
            <input type='radio' id='option%s' name='answer' value='%s'>
            <label for='option%s'>%s</label>
        </div>"""
        tag = tag % (i, randomOptions[i], i, randomOptions[i])
        wrapper = wrapper + tag

    if index != 3:
        # write button to submit answer and move on to next question
        button = "<a href='question%s.html'><button>Submit answer</button></a>"
        button = button % (index + 2)
    else: # last question
        # write button to submit answer and move on to image question
        button = "<a href='imageQuestion.html'><button>Submit answer</button></a>"

    closing = button + "</body></html>"
    whole = wrapper + closing
    f.write(whole)
    f.close()

def writeImageQuestionHtml(question, answer, distractors):
    # randomize list of answers
    randomOptions = distractors
    randomOptions.append(answer)
    random.shuffle(randomOptions)

    # write html page for one question
    htmlPage = 'imageQuestion.html'
    f = open(htmlPage, 'w')
    wrapper = """<html>
    <head><link rel="stylesheet" type="text/css" href="style.css"></head>
    <body>
        <h2>Image-Based Question:</h2>
        <p>%s</p>
        <div id='image-box'>
        <div id='image-options'>"""
    wrapper = wrapper % (question)

    # write radio button answers
    for i in range(len(randomOptions)):
        tag = """<div id='option%s'>
            <input type='radio' id='option%s' name='answer'>
            <label for='option%s'><img src='%s'></label>
        </div>"""
        tag = tag % (i, i, i, randomOptions[i])
        wrapper = wrapper + tag

    closing = """</div>
                 </div>"""

    # write button to submit answer and move on to next question
    button = "<button>Submit answer</button>"

    whole = wrapper + closing + button + "</body></html>"
    f.write(whole)
    f.close()

writeHtml("questions.csv", sys.argv[1], sys.argv[2])
