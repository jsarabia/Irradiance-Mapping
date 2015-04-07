import optparse
import os
import shutil
import subprocess

parser = optparse.OptionParser()
parser.add_option('-d', '--directory', help="image directory")
parser.add_option('-e', '--executable', help="path to Image Magick convert executable")
parser.add_option('-i', '--formatIn', default='TGA', help="extension of files to convert")
parser.add_option('-o', '--formatOut', default='png', help="extension of files after conversion")


(opts, args) = parser.parse_args()

results_directory = opts.directory
exe = opts.executable
extIn = '.' + opts.formatIn
extOut = '.' + opts.formatOut

for filename in os.listdir(results_directory):
	filepath = os.path.join(results_directory, filename)
	if os.path.isfile(filepath):
		base,ext = os.path.splitext(filename)
		if ext == extIn:
			command = [exe, filepath, os.path.join(results_directory, base+extOut)]
			subprocess.call(command)



