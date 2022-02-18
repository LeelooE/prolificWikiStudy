import pandas as pd
import csv
import wikipediaapi

def writeJson(csvFile):
    # create pandas DataFrame from csv file
    df = pd.read_csv(csvFile)
    df.columns = ['pageTitle', 'sectionTitles', 'imageURL',
    'question1', 'answer1', 'distractors1', 'question2', 'answer2', 'distractors2',
    'question3', 'answer3', 'distractors3', 'question4', 'answer4', 'distractors4',
    'imageQuestion', 'imageAnswerURL', 'imageDistractor1', 'imageDistractor2', 'imageDistractor3']
    json = df.to_json(r'WorldKnowledgeQs.json', orient='records')

writeJson('questions.csv')
