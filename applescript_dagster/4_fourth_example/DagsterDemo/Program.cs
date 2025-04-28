// Program.cs
using System;
using System.IO;

namespace DagsterDemo
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length < 1)
            {
                Console.WriteLine("Please provide a name argument");
                return;
            }

            string name = args[1];
            Console.WriteLine($"Hello {name} from C#!");
            Console.WriteLine($"Current time: {DateTime.Now}");

            string folder = args[0];
            foreach (var file in Directory.GetFiles(folder, "text*.txt"))
            {
                string newName = file.Replace("text", "file");
                File.Move(file, newName);
                Console.WriteLine($"Renamed {file} to {newName}");
            }
        }
    }
}