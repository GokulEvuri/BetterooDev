//**** Variables ****//

var poll_id_gen = 0;
var vote_id_gen = 0;

//**** Abstract Functions ****//

// Before using this dunction use functions to check email and username are unieque.
function register_user(username,email,f_name,l_name,pass_hash,dynamodb){
	var user =  {
            "TableName":"users",
              "Item":{
              "user_name":{"S": username},
              "email":{"S":email},
              "f_name":{"S":f_name},
              "l_name":{"S":l_name},
              "password":{"S":pass_hash},
              "created":{"N": new Date().getTime().toString()}
              
            }
        }

  dynamodb.putItem( user, function(err, result) {
    if(err) console.log(err,err.stack);
      else  
      console.log(result);
  });
};

//function is_uname_unieque(username){};

//login
function login(username, pass_hash, dynamodb,res){

	var item = {
		"Key": {
			"user_name": {"S":username}
		},
		"TableName": "users",
		"AttributesToGet":[ "password"
		]
	}
	dynamodb.getItem(item,handle_login);


function handle_login(err,data){
		if(err)
			console.log(err,err.stack);
		else
			console.log("ok");
		var login_bool=(data.Item.password.S==pass_hash)?"true":"false";
			console.log("22 "+login_bool);
			res.json(login_bool);
			//res.end();		
}

};

// For MVP, later handle options as an array
// Function create_poll(question,option1,option2,dynamodb,res){
function create_poll(question,option1,option2,dynamodb){
  
	var poll_var =  {
            "TableName":"polls",
              "Item":{
              "poll_id":{"N": poll_id_gen+""},
              "total_votes":{"N":'0'},
              "total_views":{"N":'0'},
              "question":{"S":question},
              // Option Discription, image reference(Key) from S3,No.Of votes
              "option1":{"SS":[option1,image1_ref,'0']},
              "option2":{"SS":[option2,image2_ref,'0']},
              //Vote id's from vote id  
              "option1VID":{"SS":["0"]},
              "option2VID":{"SS":["0"]},
              // fill in here with option stats dynamically
              // "option1_stats"
              "created_by":{"S":user_id},
              "created":{"N": new Date().getTime().toString()}
              
            }
        }
  dynamodb.putItem( poll_var, function(err, result) {
    if(err) console.log(err,err.stack);
      else  
      poll_id_gen = poll_id_gen+1;
      console.log(result);
  });	
//	res.write("poll created");
//res.end();
};

function vote(req,res){
  var postID = req.query.post_id;
  var vote = req.query.option;
  var time_taken = req.query.time_taken;
  // increase total no of votes
  var location = req.query.location;
  var local_time = req.query.local_time;
  var voter_id = req.query.user_id;


  var vote_var =  {
            "TableName":"votes",
              "Item":{
              "vote_id":{"N": vote_id_gen+""},
              // fill in here with option stats dynamically
              // "option1_stats"
              "votedOn":{"N": new Date().getTime().toString()},
              "time_taken":{"N":time_taken+""},
              "location":{"S":location},
              "local_time":{"N":local_time+""},
              "voter":{"S":voter_id}
            }
        }

  dynamodb.putItem( poll_var, function(err, result) {
    if(err) console.log(err,err.stack);
      else  
      console.log(result);
  }); 
//  res.write("poll created");
//res.end();
}



function upload_image(req,s3){

}

//**** LOW-LEVEL FUNCTIONS ****//



function test1(){
  for (var i=0;i<100;i++)
  { 
    poll_id_gen = poll_id_gen+1;
  console.log(poll_id_gen);
  }
}



// to create a new user in database
function create_user(userobject){

};

// Split in to country view, city view, neighbour hood view.
function map_distribution(post_id){
  //Get post with that id from database
  //create send buffer and depending up on country_view
}

function get_stats(req,res){
  // Get post id from req
  var postID = req.query.post_id;
//See if the option stats are available, if so, add the vote to that list, else add option stat for that option
  // Get following details related to post_id
    //Total Votes
      // In total
      // For each option
    //Total Views
    //Vote Distribution (Same for both options)
      // All the countries, from where votes are available
    //Time of votes with 5 minutes resulotion
    //Time of votes with after showing the poll
  // Construct JSON with following keys
  // Send this constructed JSON to using res.sendjson()
}


//Testing functions
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
function test(){
// Creating object for dynamoDB
var dynamodb = new AWS.DynamoDB();
var S3 = new AWS.S3();
  create_poll("Who you know?","Osama","Obama",dynamodb);
  var item = {
    "Key": {
      "poll_id": {"N":'0'}
    },
    "TableName": "polls",
    "AttributesToGet":[ "option1"
    ]
  }
  dynamodb.getItem(item,print);
}


function print(err,data){
  console.log(data.Item.option1.SS);
}

function cpdsa(question,option1,option2,dynamodb){
  
  var poll_var =  {
            "TableName":"polls",
              "Item":{
              "poll_id":{"N": poll_id_gen+''},
              "total_votes":{"N":'0'},
              "total_views":{"N":'0'},
              "question":{"S":question},
              "option1":{"SS":[option1,"image1_ref","9"]},
              "option2":{"S":option2,"S":"image2_ref","S":"8"},
              // fill in here with option stats dynamically
              // "option1_stats"
              "created":{"N": new Date().getTime().toString()}             
            }
        }
  dynamodb.putItem( poll_var, function(err, result) {
    if(err) console.log(err,err.stack);
      else  
      poll_id_gen = poll_id_gen+1;
      console.log(result);
  }); 
//  res.write("poll created");
//res.end();
};

test();

exports.register_user = register_user; //public function
//exports.is_uname_unieque = is_uname_unieque; //public function
exports.login = login;
exports.create_poll = create_poll;
exports.get_stats = get_stats;
exports.vote = vote;