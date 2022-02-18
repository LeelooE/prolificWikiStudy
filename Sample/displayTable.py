import csv
import webbrowser
import pandas as pd
from IPython.display import HTML

# This Python script displays the contents of the .csv file "Wikipedia Image Experiment"
# (available at https://docs.google.com/spreadsheets/d/18DoPkfBba9lmRG05dKMaqh4IkLzk5hCuRGm6QOvHo-Q/edit?usp=sharing)
# in an html table with images rendered

# return html image tag using the given path as its img source
def path_to_img(path):
    return '<img src="' + str(path) + '" width="100">'

# csv version of "Wikipedia Image Experiment"
filename = "questions1.csv"

# for more info on DataFrames, see https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.DataFrame.html
df = pd.read_csv(filename)
# modify dataframe contents

# transform image links into html img tags
df["URL of image to display"] = df["URL of image to display"].apply(lambda x : path_to_img(x))
df["Image answer url"] = df["Image answer url"].apply(lambda x : path_to_img(x))
df["Image distractor 1"] = df["Image distractor 1"].apply(lambda x : path_to_img(x))
df["Image distractor 2"] = df["Image distractor 2"].apply(lambda x : path_to_img(x))
df["Image distractor 3"] = df["Image distractor 3"].apply(lambda x : path_to_img(x))

df.to_html(escape=False)
HTML(df.to_html(escape=False))
df.to_html('test.html', escape=False)

filename = 'file:///wikiImages/Sample/' + 'test.html'
webbrowser.open_new_tab(filename)
