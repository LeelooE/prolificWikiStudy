from readability import Readability
import wikipediaapi

def printReadingScore(pageTitle):

r = Readability('theshining.txt')
f = r.flesch()
print(f.score)
print(f.ease)
print(f.grade_levels)

printReadingScore
