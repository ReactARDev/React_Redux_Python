import os, datetime, re, json

# Given two dicts, merge them into a new dict as a shallow copy.
# taken from http://stackoverflow.com/questions/38987/how-can-i-merge-two-python-dictionaries-in-a-single-expression
def merge_two_dicts(x, y):
    z = x.copy()
    z.update(y)
    return z

# Ensure that the directory structure is available to save files
def ensure_directories(path):
    dir = path.split('/')
    check_dir = dir.pop(0)
    while dir:
        directory = dir.pop( 0 )
        # Done when you get to a file xxx.yyy
        if not directory == '.' and '.' in directory:
            break

        check_dir += '/' + directory
        try:
            os.stat(check_dir)
        except:
            os.mkdir(check_dir)

# Converts strings of True/False into booleans that match..
def str_to_bool(s):
    if s == 'True' or s == 'true' or s == True:
         return True
    elif s == 'False' or s == 'false' or s == False:
         return False
    else:
         raise ValueError(str(s) + " does not seem to be a boolean")

## Grabbed this from older versions of scrapinghub code
# Does a little extra work to ensure that the summary_text
# Looks good.
def full_text_to_summary_text(text):
    first_500_chars = text[:500]
    if len(first_500_chars) < 500:
        return first_500_chars
    if first_500_chars.strip()[-1:] in ["?", ".", "!"]:
        return first_500_chars
    last_space = first_500_chars.strip().rfind(' ')
    last_word_text = first_500_chars[:last_space]
    if last_word_text[-1:] in [".", ","]:
        return last_word_text + " ..."
    return last_word_text + "..."

def vali_date(str_date):
    if str_date is None or str_date is False:
        return None

    if isinstance( str_date, datetime.datetime ):
        str_date = str_date.datetime.strftime( '%Y-%m-%d %H:%M:%S' )

    # print( "vali_date: {}".format( str_date ) )
    result = re.search('[0-9]{4}[/|-][0-9]{1,2}[/|-][0-9]{1,2}( [0-9]{2}\:[0-9]{2}:[0-9]{2})?', str_date)

    if result:
        str_date = result.group(0)
    else:
        str_date = None

    return str_date

#####
## Used for Scraped data
## If you process scraped data twice and data has changed or updated
## it should be reflected in the data stored.
#####
class Scraped_Value_Modifiers():
    @staticmethod
    def update_json(source, target):
        if source is None:
            return target

        if target is None:
            return source

        for key, value in source.iteritems():
            if not key in target.keys():
                target[ key ] = value
            else:
                if isinstance( value, dict):
                    target[ key ] = Scraped_Value_Modifiers.update_json( value, target[ key ] )
                elif isinstance( value, list):
                    target[ key ] = Scraped_Value_Modifiers.update_array( value, target[ key ] )
                elif isinstance( value, str ):
                    target[ key ] = Scraped_Value_Modifiers.update_string( value, target[ key ] )
                elif isinstance( value, int ):
                    target[ key ] = Scraped_Value_Modifiers.update_number( value, target[ key ] )

        return target

    @staticmethod
    def update_array(source, target):
        if source is None:
            return target

        if target is None:
            return source

        if not isinstance( source, list ) or not isinstance( target, list ):
            return target

        # Neither are None!
        for source_value in source:
            if not source_value in target:
                target.append( source_value )

        return target

    @staticmethod
    def update_number(source, target):
        if source is None:
            return target

        return source

    @staticmethod
    def update_string(source, target):
        if source in [None, "", "-", "Default"]:
            return target

        return source

    @staticmethod
    def update_date(source, target):
        if source is None:
            return target

        return source


if __name__ == "__main__":
    source_json = json.loads( '{ "one": 1, "two": { "three": "three", "four": [ 2, 4, 6 ] }, "five": "2016-01-01" }' )
    target_json = json.loads( '{ "two": { "four": [ 1, 3, 5 ] }, "five": "2016-01-03" }' )

    new_value = Scraped_Value_Modifiers.update_json( source_json, target_json )

    answer = json.loads('{"five": "2016-01-03", "two": {"four": [1, 3, 5, 2, 4, 6], "three": "three"}, "one": 1}')
    print( "JSON: {}".format(json.dumps(new_value)))
    print( "SHOULD BE: {}".format(json.dumps(answer)))

    print( "This is the source: {}".format(Scraped_Value_Modifiers.update_string("This is the source", "")))
    print( "This is the source: {}".format(Scraped_Value_Modifiers.update_string("This is the source", "-")))
    print( "This is the source: {}".format(Scraped_Value_Modifiers.update_string("This is the source", "Default")))
    print( "This is the source: {}".format(Scraped_Value_Modifiers.update_string("This is the source", None)))
    print( "This is the source: {}".format(Scraped_Value_Modifiers.update_string("This is the source", "This is the target")))
    print( "This is the target: {}".format(Scraped_Value_Modifiers.update_string("", "This is the target")))
    print( "This is the target: {}".format(Scraped_Value_Modifiers.update_string("-", "This is the target")))
    print( "This is the target: {}".format(Scraped_Value_Modifiers.update_string("Default", "This is the target")))
    print( "This is the target: {}".format(Scraped_Value_Modifiers.update_string(None, "This is the target")))

    print( "[1, 2, 3, 4, 5]: {}".format(sorted(Scraped_Value_Modifiers.update_array([1,2,3,4], [3,4,5]))))
    print( "[1, 2, 3, 4]: {}".format(sorted(Scraped_Value_Modifiers.update_array([1,2,3,4], None))))
    print( "[3, 4, 5]: {}".format(sorted(Scraped_Value_Modifiers.update_array(None, [3,4,5]))))








