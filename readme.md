# CamperView 

* 
* Add Landing Page
* Add Campgrounds Page That Lists All Campgrounds
*

# Each Campground Has:

* 
* Name
* Image
* 
* V1: Start with an array for this. No access to database yet
* [
*   {name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },{name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },{name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },{name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },{name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },{name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },{name: 'Salmon Creek',
*    image: 'http://www.image.com'
*   },
* ]
* 


# Layout and Basic Styling

*
* Create our header and footer partials
* Add in Bootstrap
*

# Creating New Campgrounds

*
* Setup new campground POST route
*   follow REST routing: meaning it's just
*   a convention to follow where to show some
*   get requests (like campgrounds), we use /campgrounds
*   and to add new campgrounds (for posting), we also use
*   the same route (/campgrounds) but for POST method
* Add in body-parser
* Setup route to show form
* Add basic unstyled form
*

# Style the Campgrounds Page

*
* Add a better header/title
* Make campgrounds display in a grid
* 

# Style the Navbar And Form

*
* Add a navbar to all templates
* Style the new campground form
* 


<!--Update 2-->
# Add Mongoose

* 
* Install and configure mongoose
* Setup campground model
* Use campground model inside of our routes!
* 

# Show Page

*
* Review the RESTful routes we've seen so far
* 
* Add description to our campground model
* 
* Show db.collection.drop():
*   deletes every thing in database, useful 
*   when making big changes to data and having
*   pre-existing data
*       will return 'true' if successful
* Add a show route/template
* 
* RESTFUL ROUTES -- good to follow for consistent structure
* 
* name of path           url                method             desc.
* =====================================================================
* INDEX                 /dogs               GET         Display a list of all dogs
* NEW                   /dogs/new           GET         Displays form to make new dog
* CREATE                /dogs               POST        Add new dog to Db
* SHOW                  /dogs/:id           GET         Shows info about a particular dog
* 
* So, using CamperView as an example:
* INDEX would be /campgrounds
* NEW would be /campgrounds/new
* CREATE would be /campgrounds (POST)
* 
* REMEMBER: 
* ****** we need 2 routes to send a POST request 
*   1. SHOW FORM (NEW)
*   2. SUBMIT TO DB (CREATE)
*


<!--Update 3-->
# Refactor Mongoose Code

* 
* Create a models directory
* Use module.exports
* Require everything correctly!
* 

# Add Seeds File

* 
* Add a seeds.js file
* Run the seeds file every time the server starts:
*   so we can seed our database with some data
*       empty and then fill with sample data
* 

# Add the Comment Model

* 
* Make our errors go away!
* Display comments on campground show page
* 


<!-- Update 4 -->

# Comment Functionality: New/Create

* 
* Discuss nested routes
*   if we want comments to be associated with a 
*   particular campground, we nest routes:
*       /campgrounds/:id/comments/new (GET)
*       /campgrounds/:id/comments (POST)
* Add the comment NEW and CREATE routes
* Add the NEW comment form
* 


<!-- Update 5 -->

# Styling the SHOW Page

* 
* Add style to the SHOW page
* Add sidebar to show page
* Display comments nicely
* 

# Finish Styling SHOW Page

* 
* Add public directory
* Add custom stylesheet
*

<!-- Update 6 -->

# Add User Model

* 
* Install all dependencies for auth
* Define user model
* 

# Auth Pt 2 - Registration

* 
* Configure Passport
* Add register routes
* Add register template
* 

# Auth Pt 3 - Login

* 
* Add login routes
* Add login template
* 

# Auth Pt 4 - Logout/Navbar

* 
* Add logout routes
* Prevent user from adding a comment if not signed in
* Add links to navbar
* Show/hide auth links correctly
* 

# Auth Pt 5 - Show/Hide Links

* 
* Show/hide auth links in navbar correctly
*


<!-- Update 7-->

# Refactor the Routes

* 
* Use Express router to reorganize all routes
*


<!-- Update 8 -->

# Users & Comments Associations

* 
* Associate users and comments
* Save author's name to a comment automatically
*



<!-- Update 9 -->

# Users + Campground Associations

* 
* Prevent an unauthenticated user from creating a campground
* Save username + id to newly created campground
* 


<!-- Update 10-->

# Editing Campgrounds

* 
* Add Method-Override
* Add Edit Route for Campgrounds
* Add Link to Edit Page
* Add Update Route
* Fix $set Problem
*

# Deleting Campgrounds

* 
* Add Destroy Route
* Add Delete Button
*

# Authorization Pt 1 - Campgrounds

*
*  - authentication is validating someone is who they say they are
*  - authorization is validating someone's credentials to perform some action
* User can only edit his/her campground 
* User can only delete his/her campgrounds
* Hide/Show edit and delete buttons
*

# Authorization Pt 2 - Comments

# Editing Comments

* 
* Need to deal with nested routes!
* Add Edit route for comments
* Add Edit button
* Add Update route
*

# Deleting Comments

* 
* Add Destroy route for comments
* Add Destroy button
*

# Authentication 

*
* User can only edit his/her comment
* User can only delete his/her comments
* Hide/Show edit and delete buttons
* Refactor Middleware
* 


<!-- Update 11 -->

# Adding in Flash

* 
* Demo working version
* Install and configure connect-flash
* Add bootstrap alerts to header
*


<!-- Update 17 -->

* 
* Adding likes system
* Added semantic campground urls
* 