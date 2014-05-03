//**** Variables ****//

var poll_id_gen = 0;
var vote_id_gen = 0;
var image_id_gen = 0;
var s3_bucket = "betteroo-images";

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
//			console.log("ok");
		var login_bool=(data.Item.password.S==pass_hash)?"true":"false";
//			console.log("22 "+login_bool);
			res.json(login_bool);
			//res.end();		
}

};


// Image referance
function get_imageref_id(res){
  var temp = image_id_gen+1;
    res.json('{image_ref,'+temp+'}');
    image_id_gen = image_id_gen+1;
}

// For MVP, later handle options as an array
// Function create_poll(question,option1,option2,dynamodb,res){
// Image_ref, position update(with x1,2 and y1,2); dimentions (width, height);
function create_poll(question,
                      option1,option2,
                      image1_ref,i1_width,i1_height,i1_left,i1_right,i1_bottom,i1_up,
                      image2_ref,i2_width,i2_height,i2_left,i2_right,i2_bottom,i2_up,
                      dynamodb,res){
  
	var poll_var =  {
            "TableName":"polls",
              "Item":{
              "poll_id":{"N": poll_id_gen+""},
              "total_votes":{"N":'0'},
              "total_views":{"N":'0'},
              "question":{"S":question},
              // Option Discription, image reference(Key) from S3,No.Of votes
              "option1":{"SS":[option1,image1_ref]},
              "image1_dimensions":{"SS":[i1_width,i1_height,i1_left,i1_right,i1_bottom,i1_up]},
              "option2":{"SS":[option2,image2_ref]},
              "image2_dimensions":{"SS":[i2_width,i2_height,i2_left,i2_right,i2_bottom,i2_up]},
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
       res.json("ok");
       //console.log(result);
     }
    };
//	res.write("poll created");
//res.end();
};

//function get_poll(poll_id,dynamodb){
function get_poll(poll_id,dynamodb,res){
    var item = {
    "Key": {
      "poll_id": {"N":poll_id}
    },
    "TableName": "polls",
    "AttributesToGet":["poll_id","total_votes","question","option1","image1_dimensions","option2","image2_dimensions",
                        "option1VC","option2VC"]
  }
  dynamodb.getItem(item,send_poll);


function send_poll(err, result){
  var sData = {
            "question": result.Item.question,
            "option1": result.Item.option1,
            "image1_dimensions": result.Item.image1_dimensions,
            "option1VC": result.Item.option1VC,
            "option2": result.Item.option2,
            "image2_dimensions": result.Item.image2_dimensions,
            "option2VC": result.Item.option2VC,
            "poll_id":result.Item.poll_id
};
  res.send(JSON.stringify(sData));
//console.log(JSON.stringify(result));
}
}

// implement active/inactive with unvote function
//function vote(req,res){
function vote(postID,vote,time_taken,
          location,local_time,voter_id,ip_address,
          dynamodb,res){
/* function vote(postID,vote,time_taken,
          location,local_time,voter_id,ip_address,
          dynamodb){*/
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
              "location":{"SS":[location.country_name,location.city,location.region_name,
                                location.latitude,location.longitude,location.area_code]},
              "ip_address":{"S":ip_address},
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
        vote_id_gen = vote_id_gen + 1;
        //Testing
        //console.log(result);
      }
      
  }

// in res write no of votes from  both options as json, so that FE can display both numbers on images
// res.write();

// updating poll values, i.e total vote count, each option vote count.
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
  res.send("ok");           
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


//function get_heatmapdata(req,res,dynamodb){
function get_heatmapdata(dynamodb){
{
    "AttributesToGet": [],
    "ConditionalOperator": "string",
    "IndexName": "string",
    "KeyConditions": 
        {
            "string" :
                {
                    "AttributeValueList": [
                        {
                            "B": "blob",
                            "BS": [
                                "blob"
                            ],
                            "N": "string",
                            "NS": [
                                "string"
                            ],
                            "S": "string",
                            "SS": [
                                "string"
                            ]
                        }
                    ],
                    "ComparisonOperator": "string"
                }
        },
    "QueryFilter": 
        {
            "string" :
                {
                    "AttributeValueList": [
                        {
                            "B": "blob",
                            "BS": [
                                "blob"
                            ],
                            "N": "string",
                            "NS": [
                                "string"
                            ],
                            "S": "string",
                            "SS": [
                                "string"
                            ]
                        }
                    ],
                    "ComparisonOperator": "string"
                }
        },
    "ReturnConsumedCapacity": "string",
    "ScanIndexForward": "boolean",
    "Select": "string",
    "TableName": "votes"
}


    dynamodb.client.scan({
        TableName : "votes",
        Limit : 50
    }, function(err, data) {
        if (err) { console.log(err); return; }
        console.log(data.id);
 
        for (var ii in data.Items) {
            ii = data.Items[ii];
            console.log(ii.id);
            console.log(ii.taken);
            console.log(ii.thumb);
            console.log(ii.full);
        }
    });

}

//to get a signed url to load images from s3
function get_s3Url(req,res,s3){
 
  var params = {Bucket: s3_bucket, Key: req.body.image_ref, Expires: 60};
  var url = s3.getSignedUrl('getObject', params, function (err, url) {
    if (url){ 
      //console.log("The URL is", url);
      var tmpUrl = {"url":url};
      res.send(JSON.stringify(tmpUrl));
    }
  });
}

//temperory link to upload the image
function upload_image(req,res,s3){
var params = {Bucket: s3_bucket, Key: req.body.image_ref, Expires:480};
var url = s3.getSignedUrl('putObject', params, function (err, url) {
  if (url){ 
      //console.log("The URL is", url);
      var tmpUrl = {"url":url};
      res.send(JSON.stringify(tmpUrl));
    }
  });
}

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
get_heatmapdata(dynamodb);

//var S3 = new AWS.S3();
//  create_poll("Who you know?","Osama","Obama",dynamodb);
/*var params = {
        TableName : 'votes',
        IndexName : 'make-index',
        KeyConditions : 
        {
            "make" : 
            {
                "AttributeValueList" : [
                {
                    "S" : 'ford'
                }
                ],
                "ComparisonOperator" : "EQ"
            }
        },
    }
    dynamodb.query(params, function(err, data) {
        if (err) {
            console.log (err)
            callback(err, null)
        } else {
            callback(null, data.Items)
        }
    });*/

/*  var item = {
    "Key": {
      "poll_id": {"N":'0'}
    },
    "TableName": "polls",
    "AttributesToGet":[ "option1"
    ]
  }
  dynamodb.updateItem(item,print);
  vote("1","2","23456",
          "Sweden","1234","234",
          dynamodb);*/
//get_poll('0',dynamodb);
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
exports.get_imageref_id = get_imageref_id;
exports.get_s3Url = get_s3Url;
exports.upload_image = upload_image;