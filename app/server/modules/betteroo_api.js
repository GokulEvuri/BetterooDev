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
function create_poll(question,option1,option2,image1_ref,image2_ref,dynamodb,res){
  
	var poll_var =  {
            "TableName":"polls",
              "Item":{
              "poll_id":{"N": poll_id_gen+""},
              "total_votes":{"N":'0'},
              "total_views":{"N":'0'},
              "question":{"S":question},
              // Option Discription, image reference(Key) from S3,No.Of votes
              "option1":{"SS":[option1,image1_ref]},
              "option2":{"SS":[option2,image2_ref]},
              //Option view countS
              "option1VC":{"N":"0"},
              "option2VC":{"N":"0"},
              //Vote id's from vote id  
              "option1VID":{"SS":["null"]},
              "option2VID":{"SS":["null"]},
              // fill in here with option stats dynamically
              // "option1_stats"
 //             "created_by":{"S":user_id},
              "created":{"N": new Date().getTime().toString()}
              
            }
        };
  dynamodb.putItem(poll_var, onput);	
  function onput(err, result) {
      if(err) {
          res.send("failed");
          console.log(err,err.stack);
            }
       else  {
       poll_id_gen = poll_id_gen+1;
       res.send("ok");
       //console.log(result);
     }
    };
//	res.write("poll created");
//res.end();
};

function get_poll(poll_id,dynamodb,res){
    var item = {
    "Key": {
      "poll_id": {"S":poll_id}
    },
    "TableName": "polls"
//   ,"AttributesToGet":[ "password"]
  }
  dynamodb.getItem(item,send_poll);


function send_poll(err, result){
  res.send(JSON.stringify(result));
}
}

//function vote(req,res){
/*function vote(postID,vote,time_taken,
          location,local_time,voter_id,
          dynamodb,res){*/
  function vote(postID,vote,time_taken,
          location,local_time,voter_id,
          dynamodb){
//See if the option stats are available, if so, add the vote to that list, else add option stat for that option
  // increase total no of votes in option
  var vote_id = vote_id_gen+"";
  var vote_var =  {
            "TableName":"votes",
              "Item":{
              "vote_id":{"N": vote_id},
              "votedOn":{"N": new Date().getTime().toString()},
              "voted_option":{"N":vote+""},
              "time_taken":{"N":time_taken+""},
              "location":{"S":location},
              "local_time":{"N":local_time+""},
              "voter":{"S":voter_id}
            }
        };
  dynamodb.putItem(vote_var, handle_aftervote);

function handle_aftervote(err, result) {
    if(err) {console.log(err,err.stack);}
      else  
      {
//        handle_vote(postID,vote,vote_id,res);
          handle_vote(postID,vote,vote_id);
        //Testing
        //console.log(result);
      }
      
  }

// in res write no of votes from  both options as json, so that FE can display both numbers on images
// res.write();

function handle_vote(postID,vote,vote_id){
//function handle_vote(postID,vote,vote_id,res){
  
  var tmp1 = vote+"VC";
  //"option"+vote+"VC"
  var optionvotevc_key = "option"+tmp1;
  //"option"+vote+"VID"
  var tmp2 = vote+"VID";
  var optionvotevid_key = "option"+tmp2;

  var params = {
          "TableName": "polls",
        "Key": { 
         "poll_id": {"N":postID}
      },
        "AttributeUpdates": {
          "total_votes": {
            "Action": "ADD",
            "Value": {
              "N": '1'            // Dynamo incriments 1 to existing value
            }
          },

          optionvotevc_key:{
            "Action":"PUT",
            "Value":{
              "N":"1"
            }     
          },
          optionvotevid_key:{
            "Action":"PUT",
            "Value":{
              "S":vote_id
            }
          }
        },
      };
 
  dynamodb.updateItem(params, function(err, data) {
  if (err) {console.log(err, err.stack); }
  else     {
    //console.log(data);
//    res.send("ok");           
  console.log("ok");
  }

});
}
}

function get_stats(req,res){
 //  Get post id from req
  var postID = req.query.post_id;

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
 var item = {
   "Key": {
     "poll_id": {"N":postID}
   },
   "TableName": "polls",
  "AttributesToGet":[ "total_votes","total_views","option1VID","option2VID"
   ]
 }

 dynamodb.getItem(item,handle_postDataStats);


function handle_postDataStats(err,data){
    if(err)
      console.log(err,err.stack);
    else
      console.log("ok");
    var total_views = data.Item.total_views.N;
    var total_votes = data.Item.total_votes.N;
// testing
  res.json(total_views+" "+total_votes);
  function handle_postDataStatsO1(err,data){
    if(err)
      console.log(err,err.stack);
    else
      console.log("ok");
// Handle here, how front end needs data
// res.json(stat data);
      //res.end();    
}

}
}


//function upload_image(req,s3){
//}

//**** LOW-LEVEL FUNCTIONS ****//


//**** TESTING FUNCTIONS ****//
/* function test1(){
  for (var i=0;i<100;i++)
  { 
    poll_id_gen = poll_id_gen+1;
  console.log(poll_id_gen);
  }
}
*/


// to create a new user in database
//function create_user(userobject){

//};

// Split in to country view, city view, neighbour hood view.
//function map_distribution(post_id){
  //Get post with that id from database
  //create send buffer and depending up on country_view
//}




//Testing functions
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
function test(){
// Creating object for dynamoDB
var dynamodb = new AWS.DynamoDB();
var S3 = new AWS.S3();
//  create_poll("Who you know?","Osama","Obama",dynamodb);

/*  var item = {
    "Key": {
      "poll_id": {"N":'0'}
    },
    "TableName": "polls",
    "AttributesToGet":[ "option1"
    ]
  }
  dynamodb.updateItem(item,print);*/
  vote("1","2","23456",
          "Sweden","1234","234",
          dynamodb);
}

test();

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

//test();

//exports.register_user = register_user; //public function
//exports.is_uname_unieque = is_uname_unieque; //public function
//exports.login = login;
exports.create_poll = create_poll;
exports.get_poll = get_poll;
//exports.get_stats = get_stats;
exports.vote = vote;