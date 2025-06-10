'''
Export the users from SSO groups in cognito into a JSON stream file

Read the file with jq -s
'''
import boto3
import datetime
import json
import argparse
import sys


parser = argparse.ArgumentParser()

parser.add_argument(
    '--user_group',
    choices=[
      'Google',
      'Facebook',
      'SignInWithApple'
    ],
    required=True)
parser.add_argument(
    '--user_pool_id',
    required=True)

args = parser.parse_args()


user_group = args.user_group
user_pool_id = args.user_pool_id
print("Getting users for ", user_group, file=sys.stderr)


cognito = boto3.client('cognito-idp')
users = cognito.list_users_in_group(UserPoolId=user_pool_id, GroupName=f'{user_pool_id}_{user_group}')
paginator = cognito.get_paginator('list_users_in_group')
pages = iter(paginator.paginate(UserPoolId=user_pool_id, GroupName=f'{user_pool_id}_{user_group}'))
for i, user_list in enumerate(pages):
    for user in user_list['Users']:
        dateless_user = {k: v for k,v in user.items() if not isinstance(v, datetime.datetime)}
        print(json.dumps(dateless_user))
